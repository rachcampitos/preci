import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ScrapedProductData } from './vtex.scraper';

interface TottusProduct {
  productId: string;
  skuId: string;
  displayName: string;
  brand: string;
  url: string;
  mediaUrls: string[];
  measurements?: { format: string; unit: string };
  prices: TottusPrice[];
  sellerId: string;
  sellerName: string;
  discountBadge?: { label: string };
}

interface TottusPrice {
  type: string; // 'internetPrice' | 'normalPrice' | 'cmrPrice'
  crossed: boolean;
  price: string[];
  symbol: string;
}

interface TottusPageProps {
  results: TottusProduct[];
  pagination: {
    count: number;
    perPage: number;
    totalPerPage: number;
    currentPage: number;
  };
}

interface TottusCategoryConfig {
  id: string;
  name: string;
  slug: string;
}

// Categories covering a comprehensive range of supermarket products
const TOTTUS_CATEGORIES: TottusCategoryConfig[] = [
  // Lacteos
  { id: 'CATG16782', name: 'Leches', slug: 'Leches' },
  { id: 'CATG16783', name: 'Yogurt', slug: 'Yogurt' },
  { id: 'CATG16784', name: 'Quesos', slug: 'Quesos' },
  { id: 'CATG35329', name: 'Mantequillas', slug: 'Mantequillas' },
  // Carnes y proteinas
  { id: 'CATG16919', name: 'Carne de Pollo', slug: 'Carne-de-Pollo' },
  { id: 'CATG16918', name: 'Carne de Res', slug: 'Carne-de-Res' },
  { id: 'CATG16920', name: 'Carne de Cerdo', slug: 'Carne-de-Cerdo' },
  { id: 'CATG16832', name: 'Huevos y Fiambres', slug: 'Huevos-y-Fiambres' },
  { id: 'CATG16921', name: 'Pescados y Mariscos', slug: 'Pescados-y-Mariscos' },
  // Frutas y verduras
  { id: 'CATG16977', name: 'Papas y Camotes', slug: 'Papas-y-Camotes' },
  { id: 'CATG16978', name: 'Cebolla Tomate Ajo', slug: 'Cebolla--Tomate--Ajo-y-Ajies' },
  { id: 'CATG16994', name: 'Limones Naranjas', slug: 'Limones--Naranjas-y-Mandarinas' },
  { id: 'CATG16986', name: 'Platanos Tropicales', slug: 'Platanos--Papayas--Pinas-y-Tropicales' },
  { id: 'CATG16987', name: 'Manzanas Peras', slug: 'Manzanas--Peras--Uvas-y-Membrillos' },
  { id: 'CATG16979', name: 'Lechugas y Verduras', slug: 'Lechugas--Apios--Brocolis-y-Verduras' },
  { id: 'CATG16988', name: 'Fresas Berries', slug: 'Fresas--Arandanos--Granadas-y-Berries' },
  // Granos y cereales
  { id: 'CATG16815', name: 'Arroz', slug: 'Arroz' },
  { id: 'CATG17555', name: 'Avenas', slug: 'Avenas' },
  { id: 'CATG16826', name: 'Harina', slug: 'Harina' },
  { id: 'CATG16882', name: 'Pan', slug: 'Pan-de-la-Casa-y-Pan-de-Molde' },
  { id: 'CATG17647', name: 'Lentejas', slug: 'Lentejas' },
  { id: 'CATG16819', name: 'Fideos y Pastas', slug: 'Fideos-y-Pastas' },
  { id: 'CATG16820', name: 'Cereales', slug: 'Cereales' },
  // Aceites y basicos
  { id: 'CATG16817', name: 'Aceite', slug: 'Aceite' },
  { id: 'CATG16808', name: 'Azucar', slug: 'Azucar-y-endulzantes' },
  { id: 'CATG16816', name: 'Sal', slug: 'Sal' },
  // Bebidas
  { id: 'CATG16846', name: 'Aguas', slug: 'Aguas' },
  { id: 'CATG16845', name: 'Gaseosas', slug: 'Gaseosas' },
  { id: 'CATG16847', name: 'Jugos', slug: 'Jugos-y-Tes-Liquidos' },
  { id: 'CATG16070', name: 'Cervezas', slug: 'Cervezas' },
  { id: 'CATG16848', name: 'Cafe Te Infusiones', slug: 'Cafe--Te-e-Infusiones' },
  { id: 'CATG16072', name: 'Vinos', slug: 'Vinos' },
  { id: 'CATG16073', name: 'Destilados', slug: 'Destilados' },
  // Enlatados y salsas
  { id: 'CATG16825', name: 'Conservas', slug: 'Conservas' },
  { id: 'CATG16823', name: 'Salsas y Aderezos', slug: 'Salsas-y-Aderezos' },
  { id: 'CATG16821', name: 'Sopas y Cremas', slug: 'Sopas-y-Cremas' },
  // Panaderia y snacks
  { id: 'CATG16883', name: 'Galletas', slug: 'Galletas' },
  { id: 'CATG16884', name: 'Chocolates', slug: 'Chocolates' },
  { id: 'CATG16885', name: 'Snacks', slug: 'Snacks' },
  // Limpieza
  { id: 'CATG17770', name: 'Detergente', slug: 'Detergente-y-Cuidado-de-la-Ropa' },
  { id: 'CATG17764', name: 'Lejia', slug: 'Lejia' },
  { id: 'CATG16888', name: 'Jabones', slug: 'Jabones' },
  { id: 'CATG17765', name: 'Lavavajillas', slug: 'Lavavajillas' },
  { id: 'CATG17766', name: 'Desinfectantes', slug: 'Desinfectantes-y-Multiusos' },
  { id: 'CATG17769', name: 'Papel Higienico', slug: 'Papel-Higienico' },
  { id: 'CATG17768', name: 'Servilletas', slug: 'Servilletas-y-Papel-Toalla' },
  // Higiene personal
  { id: 'CATG17705', name: 'Shampoo', slug: 'Shampoo' },
  { id: 'CATG17707', name: 'Crema Dental', slug: 'Pasta-y-Cepillos-Dentales' },
  { id: 'CATG17709', name: 'Desodorantes', slug: 'Desodorantes' },
  { id: 'CATG17712', name: 'Toallas Higienicas', slug: 'Toallas-Higienicas' },
  { id: 'CATG17710', name: 'Panales', slug: 'Panales' },
];

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-PE,es;q=0.9,en;q=0.8',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
};

const BASE_URL = 'https://www.tottus.com.pe';

export class TottusScraper {
  private readonly logger = new Logger(TottusScraper.name);

  constructor(private readonly httpService: HttpService) {}

  async scrapeStore(): Promise<ScrapedProductData[]> {
    const allProducts: ScrapedProductData[] = [];
    const seenIds = new Set<string>();

    for (const category of TOTTUS_CATEGORIES) {
      try {
        const products = await this.scrapeCategory(category);
        for (const p of products) {
          const key = p.productId || `${p.displayName}-${p.brand}`;
          if (!seenIds.has(key)) {
            seenIds.add(key);
            const parsed = this.parseProduct(p);
            if (parsed) allProducts.push(parsed);
          }
        }
        // Respect rate limits
        await this.delay(800);
      } catch (err) {
        this.logger.warn(
          `Error scraping Tottus category "${category.name}": ${err.message}`,
        );
      }
    }

    this.logger.log(`Tottus: scraped ${allProducts.length} unique products`);
    return allProducts;
  }

  private async scrapeCategory(
    category: TottusCategoryConfig,
  ): Promise<TottusProduct[]> {
    const allResults: TottusProduct[] = [];
    let page = 1;
    const maxPages = 10; // Safety limit

    while (page <= maxPages) {
      const pageData = await this.fetchCategoryPage(category, page);
      if (!pageData || pageData.results.length === 0) break;

      allResults.push(...pageData.results);

      // Check if there are more pages
      const totalPages = Math.ceil(
        pageData.pagination.count / pageData.pagination.perPage,
      );
      if (page >= totalPages) break;

      page++;
      await this.delay(600);
    }

    this.logger.debug(
      `Tottus ${category.name}: ${allResults.length} products (${page} pages)`,
    );
    return allResults;
  }

  private async fetchCategoryPage(
    category: TottusCategoryConfig,
    page: number,
  ): Promise<TottusPageProps | null> {
    const url =
      page === 1
        ? `${BASE_URL}/tottus-pe/lista/${category.id}/${category.slug}`
        : `${BASE_URL}/tottus-pe/lista/${category.id}/${category.slug}?page=${page}`;

    const { data: html } = await firstValueFrom(
      this.httpService.get<string>(url, {
        headers: BROWSER_HEADERS,
        timeout: 20000,
        decompress: true,
        responseType: 'text' as any,
      }),
    );

    return this.extractNextData(html);
  }

  private extractNextData(html: string): TottusPageProps | null {
    const marker = '__NEXT_DATA__';
    const idx = html.indexOf(marker);
    if (idx === -1) return null;

    // Find the JSON object start after the marker
    const jsonStart = html.indexOf('{', idx);
    if (jsonStart === -1) return null;

    // Find the closing </script> tag
    const scriptEnd = html.indexOf('</script>', jsonStart);
    if (scriptEnd === -1) return null;

    const jsonStr = html.substring(jsonStart, scriptEnd);

    try {
      const data = JSON.parse(jsonStr);
      const pageProps = data?.props?.pageProps;
      if (!pageProps?.results) return null;

      return {
        results: pageProps.results,
        pagination: pageProps.pagination || {
          count: 0,
          perPage: 48,
          totalPerPage: 0,
          currentPage: 1,
        },
      };
    } catch {
      return null;
    }
  }

  private parseProduct(product: TottusProduct): ScrapedProductData | null {
    // Get the internet price (main online price)
    const internetPrice = product.prices?.find(
      (p) => p.type === 'internetPrice' && !p.crossed,
    );
    // Get the normal/list price (often crossed out)
    const normalPrice = product.prices?.find(
      (p) => p.type === 'normalPrice',
    );

    const price = this.parsePrice(internetPrice);
    if (!price || price <= 0) return null;

    const listPrice = this.parsePrice(normalPrice) || price;
    const isOnSale = listPrice > price;
    const salePercentage = isOnSale
      ? Math.round(((listPrice - price) / listPrice) * 100)
      : 0;

    return {
      name: product.displayName,
      brand: product.brand || '',
      barcode: product.skuId || product.productId, // Tottus uses internal IDs
      price,
      listPrice,
      isAvailable: true,
      isOnSale,
      salePercentage,
      imageUrl: product.mediaUrls?.[0]
        ? `${product.mediaUrls[0]}?w=400`
        : '',
      productUrl: product.url || '',
    };
  }

  private parsePrice(priceObj?: TottusPrice): number | null {
    if (!priceObj?.price?.[0]) return null;
    const value = parseFloat(priceObj.price[0].replace(/[^0-9.]/g, ''));
    return isNaN(value) ? null : value;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
