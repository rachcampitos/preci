import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export interface VtexProduct {
  productId: string;
  productName: string;
  brand: string;
  link: string;
  items: VtexItem[];
}

interface VtexItem {
  itemId: string;
  ean: string;
  name: string;
  images: { imageUrl: string }[];
  sellers: VtexSeller[];
}

interface VtexSeller {
  sellerId: string;
  commertialOffer: {
    Price: number;
    ListPrice: number;
    PriceWithoutDiscount: number;
    AvailableQuantity: number;
    IsAvailable: boolean;
  };
}

export interface ScrapedProductData {
  name: string;
  brand: string;
  barcode: string;
  price: number;
  listPrice: number;
  isAvailable: boolean;
  isOnSale: boolean;
  salePercentage: number;
  imageUrl: string;
  productUrl: string;
}

export interface VtexStoreConfig {
  chain: string;
  baseUrl: string;
  storeLabel: string;
}

interface VtexCategory {
  id: number;
  name: string;
  children?: VtexCategory[];
}

export const VTEX_STORES: VtexStoreConfig[] = [
  {
    chain: 'plaza_vea',
    baseUrl: 'https://www.plazavea.com.pe',
    storeLabel: 'Plaza Vea',
  },
  {
    chain: 'wong',
    baseUrl: 'https://www.wong.pe',
    storeLabel: 'Wong',
  },
  {
    chain: 'metro',
    baseUrl: 'https://www.metro.pe',
    storeLabel: 'Metro',
  },
  {
    chain: 'makro',
    baseUrl: 'https://www.makro.plazavea.com.pe',
    storeLabel: 'Makro',
  },
];

/**
 * Top-level category names we want to scrape.
 * Matched case-insensitively against the category tree.
 * We skip non-target categories (electrohogar, muebles, moda, etc.)
 */
const CATEGORY_PATTERNS = [
  // ── Grocery ──
  /^bebidas$/i,
  /^abarrotes$/i,
  /^frutas y verduras$/i,
  /^congelados$/i,
  /^quesos y fiambres$/i,
  /^panader[ií]a/i,
  /^carnes/i,
  /^l[aá]cteos/i,
  /^desayunos$/i,
  /^pollo rostizado/i,
  /^comidas preparadas/i,
  /^mercado saludable$/i,
  /^vinos.*licores.*cervezas$/i,
  /^limpieza$/i,
  // ── School & Office supplies ──
  /^librer[ií]a y oficina$/i,   // Plaza Vea, Makro
  /^libros y librer[ií]a$/i,    // Wong, Metro
];

/** VTEX limits pagination to 2500 items (from=0..2499). Categories above this need subdivision. */
const VTEX_MAX_PAGINATION = 2500;
const PAGE_SIZE = 50;
const DELAY_BETWEEN_PAGES = 600;
const DELAY_BETWEEN_CATEGORIES = 800;
const MAX_RETRIES = 2;

export class VtexScraper {
  private readonly logger = new Logger(VtexScraper.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Main entry point: scrape a VTEX store by navigating its category tree.
   * 1. Fetch the category tree
   * 2. Filter to grocery/relevant categories
   * 3. Paginate through each category, subdividing if >2500 products
   */
  async scrapeStore(config: VtexStoreConfig): Promise<ScrapedProductData[]> {
    const allProducts: ScrapedProductData[] = [];
    const seenBarcodes = new Set<string>();

    // Step 1: Fetch category tree
    const categories = await this.fetchCategoryTree(config);
    if (categories.length === 0) {
      this.logger.warn(`${config.storeLabel}: could not fetch category tree, falling back to search`);
      return this.scrapeBySearch(config);
    }

    // Step 2: Filter to target categories
    const targetCategories = categories.filter((cat) =>
      CATEGORY_PATTERNS.some((pattern) => pattern.test(cat.name)),
    );

    this.logger.log(
      `${config.storeLabel}: found ${targetCategories.length} target categories (of ${categories.length} total)`,
    );

    // Step 3: Scrape each category
    for (const category of targetCategories) {
      try {
        const count = await this.getCategoryProductCount(config, category.id);
        this.logger.debug(
          `${config.storeLabel} > ${category.name}: ${count} products`,
        );

        if (count === 0) continue;

        if (count <= VTEX_MAX_PAGINATION) {
          // Small enough to paginate directly
          await this.scrapeCategoryPages(
            config, category.id, category.name, count, seenBarcodes, allProducts,
          );
        } else {
          // Too large — subdivide into subcategories
          const subcats = category.children || [];
          this.logger.log(
            `${config.storeLabel} > ${category.name}: ${count} products, subdividing into ${subcats.length} subcategories`,
          );
          if (subcats.length === 0) {
            // No subcategories available, scrape what we can (first 2500)
            await this.scrapeCategoryPages(
              config, category.id, category.name, VTEX_MAX_PAGINATION, seenBarcodes, allProducts,
            );
          } else {
            for (const sub of subcats) {
              const subCount = await this.getCategoryProductCount(config, sub.id, category.id);
              if (subCount === 0) continue;
              await this.scrapeCategoryPages(
                config, sub.id, `${category.name} > ${sub.name}`,
                Math.min(subCount, VTEX_MAX_PAGINATION), seenBarcodes, allProducts,
                category.id,
              );
              await this.delay(DELAY_BETWEEN_CATEGORIES);
            }
          }
        }

        await this.delay(DELAY_BETWEEN_CATEGORIES);
      } catch (err) {
        this.logger.warn(
          `Error scraping ${config.storeLabel} category "${category.name}": ${err.message}`,
        );
      }
    }

    this.logger.log(
      `${config.storeLabel}: scraped ${allProducts.length} unique products from ${targetCategories.length} categories`,
    );
    return allProducts;
  }

  /**
   * Fallback: search-based scraping (used when category tree is unavailable)
   */
  private async scrapeBySearch(config: VtexStoreConfig): Promise<ScrapedProductData[]> {
    const FALLBACK_TERMS = [
      'leche', 'yogurt', 'queso', 'pollo', 'carne', 'huevos', 'arroz',
      'fideos', 'pan', 'aceite', 'azucar', 'agua', 'gaseosa', 'cerveza',
      'detergente', 'jabon', 'galleta', 'chocolate', 'atun', 'conserva',
    ];

    const allProducts: ScrapedProductData[] = [];
    const seenBarcodes = new Set<string>();

    for (const term of FALLBACK_TERMS) {
      try {
        const products = await this.fetchProductPage(
          config,
          `search/${encodeURIComponent(term)}`,
          0,
          49,
        );
        for (const p of products) {
          if (p.barcode && !seenBarcodes.has(p.barcode)) {
            seenBarcodes.add(p.barcode);
            allProducts.push(p);
          }
        }
        await this.delay(500);
      } catch {
        // skip
      }
    }

    return allProducts;
  }

  /**
   * Paginate through a single category collecting all products.
   */
  private async scrapeCategoryPages(
    config: VtexStoreConfig,
    categoryId: number,
    categoryName: string,
    totalProducts: number,
    seenBarcodes: Set<string>,
    allProducts: ScrapedProductData[],
    parentId?: number,
  ): Promise<void> {
    const totalPages = Math.ceil(totalProducts / PAGE_SIZE);
    let newProducts = 0;
    const filter = this.categoryFilter(categoryId, parentId);

    for (let page = 0; page < totalPages; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      try {
        const products = await this.fetchProductPage(
          config,
          `search?${filter}`,
          from,
          to,
        );

        if (products.length === 0) break;

        for (const p of products) {
          if (p.barcode && !seenBarcodes.has(p.barcode)) {
            seenBarcodes.add(p.barcode);
            allProducts.push(p);
            newProducts++;
          }
        }

        // If we got fewer results than page size, no more pages
        if (products.length < PAGE_SIZE) break;

        await this.delay(DELAY_BETWEEN_PAGES);
      } catch (err) {
        this.logger.warn(
          `Error on page ${page} of ${config.storeLabel}/${categoryName}: ${err.message}`,
        );
        // Continue to next page instead of breaking — we may recover
        await this.delay(DELAY_BETWEEN_PAGES * 2);
      }
    }

    if (newProducts > 0) {
      this.logger.debug(
        `${config.storeLabel} > ${categoryName}: +${newProducts} new products`,
      );
    }
  }

  // ─── API METHODS ──────────────────────────────────────────

  /**
   * Fetch the VTEX category tree (3 levels deep).
   */
  private async fetchCategoryTree(config: VtexStoreConfig): Promise<VtexCategory[]> {
    try {
      const url = `${config.baseUrl}/api/catalog_system/pub/category/tree/3`;
      const { data } = await firstValueFrom(
        this.httpService.get<VtexCategory[]>(url, {
          headers: this.defaultHeaders(),
          timeout: 15000,
        }),
      );
      return Array.isArray(data) ? data : [];
    } catch (err) {
      this.logger.warn(
        `Failed to fetch category tree for ${config.storeLabel}: ${err.message}`,
      );
      return [];
    }
  }

  /**
   * Build the VTEX category filter path.
   * Top-level: fq=C:/{id}/
   * Subcategory: fq=C:/{parentId}/{id}/
   */
  private categoryFilter(categoryId: number, parentId?: number): string {
    return parentId
      ? `fq=C:/${parentId}/${categoryId}/`
      : `fq=C:/${categoryId}/`;
  }

  /**
   * Get total product count for a category via the resources response header.
   * VTEX returns "resources: 0-X/TOTAL" in the header.
   */
  private async getCategoryProductCount(
    config: VtexStoreConfig,
    categoryId: number,
    parentId?: number,
  ): Promise<number> {
    try {
      const filter = this.categoryFilter(categoryId, parentId);
      const url = `${config.baseUrl}/api/catalog_system/pub/products/search?${filter}&_from=0&_to=0`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.defaultHeaders(),
          timeout: 10000,
        }),
      );
      const resources = response.headers?.['resources'] || '';
      const match = resources.match(/\/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Fetch a single page of products from VTEX with retry + exponential backoff.
   * Used for both category browsing and search fallback.
   */
  private async fetchProductPage(
    config: VtexStoreConfig,
    path: string,
    from: number,
    to: number,
  ): Promise<ScrapedProductData[]> {
    const separator = path.includes('?') ? '&' : '?';
    const url = `${config.baseUrl}/api/catalog_system/pub/products/${path}${separator}_from=${from}&_to=${to}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data } = await firstValueFrom(
          this.httpService.get<VtexProduct[]>(url, {
            headers: this.defaultHeaders(),
            timeout: 15000,
          }),
        );

        if (!Array.isArray(data)) return [];
        return data.flatMap((product) => this.parseVtexProduct(product, config));
      } catch (err) {
        const status = err?.response?.status || err?.status;
        // Retry on 500/429/503 (rate limiting / server errors)
        if (attempt < MAX_RETRIES && (!status || status >= 429)) {
          const backoff = DELAY_BETWEEN_PAGES * (attempt + 2); // 1200ms, 1800ms
          this.logger.debug(
            `Retry ${attempt + 1}/${MAX_RETRIES} for ${config.storeLabel} (${status || 'timeout'}), waiting ${backoff}ms`,
          );
          await this.delay(backoff);
          continue;
        }
        throw err;
      }
    }

    return []; // unreachable but satisfies TS
  }

  /**
   * Also keep searchProducts public for basket product scraping in scraping.service.ts
   */
  async searchProducts(
    config: VtexStoreConfig,
    query: string,
    from = 0,
    to = 49,
  ): Promise<ScrapedProductData[]> {
    return this.fetchProductPage(
      config,
      `search/${encodeURIComponent(query)}`,
      from,
      to,
    );
  }

  // ─── PARSING ──────────────────────────────────────────────

  private parseVtexProduct(
    product: VtexProduct,
    config: VtexStoreConfig,
  ): ScrapedProductData[] {
    return product.items
      .filter((item) => item.sellers?.[0]?.commertialOffer)
      .map((item) => {
        const offer = item.sellers[0].commertialOffer;
        const price = offer.Price;
        const listPrice = offer.ListPrice;
        const isOnSale = listPrice > price && price > 0;
        const salePercentage = isOnSale
          ? Math.round(((listPrice - price) / listPrice) * 100)
          : 0;

        return {
          name: product.productName,
          brand: product.brand || '',
          barcode: item.ean || '',
          price,
          listPrice,
          isAvailable: offer.IsAvailable && offer.AvailableQuantity > 0,
          isOnSale,
          salePercentage,
          imageUrl: item.images?.[0]?.imageUrl || '',
          productUrl: product.link
            ? `${config.baseUrl}${product.link}`
            : '',
        };
      })
      .filter((p) => p.price > 0);
  }

  // ─── UTILS ────────────────────────────────────────────────

  private defaultHeaders() {
    return {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept: 'application/json',
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
