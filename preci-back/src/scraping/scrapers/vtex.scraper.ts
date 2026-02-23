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

const SEARCH_TERMS = [
  // Lacteos
  'leche', 'yogurt', 'queso', 'mantequilla',
  // Carnes
  'pollo', 'carne', 'cerdo', 'huevos',
  // Frutas y verduras
  'papa', 'cebolla', 'tomate', 'limon', 'platano', 'manzana',
  // Granos y cereales
  'arroz', 'fideos', 'avena', 'pan', 'harina', 'lenteja',
  // Bebidas
  'agua', 'gaseosa', 'jugo', 'cerveza',
  // Limpieza
  'detergente', 'lejia', 'jabon',
  // Aceites
  'aceite', 'azucar', 'sal',
  // Enlatados
  'atun', 'conserva',
];

export class VtexScraper {
  private readonly logger = new Logger(VtexScraper.name);

  constructor(private readonly httpService: HttpService) {}

  async scrapeStore(config: VtexStoreConfig): Promise<ScrapedProductData[]> {
    const allProducts: ScrapedProductData[] = [];
    const seenIds = new Set<string>();

    for (const term of SEARCH_TERMS) {
      try {
        const products = await this.searchProducts(config, term);
        for (const p of products) {
          const key = `${p.barcode}-${p.price}`;
          if (!seenIds.has(key) && p.barcode) {
            seenIds.add(key);
            allProducts.push(p);
          }
        }
        // Respect rate limits — 500ms between requests
        await this.delay(500);
      } catch (err) {
        this.logger.warn(
          `Error scraping ${config.storeLabel} term="${term}": ${err.message}`,
        );
      }
    }

    this.logger.log(
      `${config.storeLabel}: scraped ${allProducts.length} unique products`,
    );
    return allProducts;
  }

  async searchProducts(
    config: VtexStoreConfig,
    query: string,
    from = 0,
    to = 49,
  ): Promise<ScrapedProductData[]> {
    const url = `${config.baseUrl}/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?_from=${from}&_to=${to}`;

    const { data } = await firstValueFrom(
      this.httpService.get<VtexProduct[]>(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          Accept: 'application/json',
        },
        timeout: 15000,
      }),
    );

    if (!Array.isArray(data)) return [];

    return data.flatMap((product) => this.parseVtexProduct(product, config));
  }

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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
