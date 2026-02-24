import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ScrapedProductData } from './vtex.scraper';

interface JustoProduct {
  _id: string;
  name: string;
  description?: string;
  image?: { url: string };
  categories?: { _id: string; name: string }[];
  availability?: { basePrice: number; finalPrice: number }[];
}

interface JustoResponse {
  data: {
    products: {
      totalCount: number;
      items: JustoProduct[];
    };
  };
}

const TAMBO_CONFIG = {
  graphqlUrl: 'https://api.getjusto.com/graphql',
  websiteId: 'EjKfjv3RYEXX9Puqa',
  menuId: 'bNNLrJR6wjzovhLsw',
};

const SEARCH_TERMS = [
  // Lacteos
  'leche', 'yogurt', 'queso', 'mantequilla', 'manjar',
  // Proteinas
  'pollo', 'huevos', 'jamon', 'salchicha', 'chorizo', 'atun', 'embutidos',
  // Granos y panaderia
  'arroz', 'fideos', 'avena', 'pan', 'cereal', 'galletas', 'harina',
  // Snacks y dulces
  'chocolate', 'caramelo', 'snack', 'papas', 'wafer', 'chicle',
  // Bebidas
  'agua', 'gaseosa', 'cerveza', 'jugo', 'cafe', 'te', 'energizante',
  'vino', 'pisco', 'refresco',
  // Limpieza y hogar
  'detergente', 'jabon', 'papel', 'lejia', 'desinfectante', 'servilleta',
  'bolsa', 'esponja',
  // Higiene
  'shampoo', 'desodorante', 'crema dental', 'toalla',
  // Basicos
  'aceite', 'azucar', 'sal', 'ketchup', 'mayonesa', 'salsa',
  // Congelados y preparados
  'sopa', 'conserva', 'hamburguesa',
];

const PRODUCTS_QUERY = `
  query SearchProducts($websiteId: ID!, $menuId: ID!, $filter: String) {
    products(websiteId: $websiteId, menuId: $menuId, filter: $filter) {
      totalCount
      items {
        _id
        name
        description
        image { url }
        categories { _id name }
        availability { basePrice finalPrice }
      }
    }
  }
`;

export class TamboScraper {
  private readonly logger = new Logger(TamboScraper.name);

  constructor(private readonly httpService: HttpService) {}

  async scrapeStore(): Promise<ScrapedProductData[]> {
    const allProducts: ScrapedProductData[] = [];
    const seenIds = new Set<string>();

    for (const term of SEARCH_TERMS) {
      try {
        const products = await this.searchProducts(term);
        for (const p of products) {
          if (!seenIds.has(p._id)) {
            seenIds.add(p._id);
            const parsed = this.parseProduct(p);
            if (parsed) allProducts.push(parsed);
          }
        }
        await this.delay(400);
      } catch (err) {
        this.logger.warn(`Error scraping Tambo term="${term}": ${err.message}`);
      }
    }

    this.logger.log(`Tambo: scraped ${allProducts.length} unique products`);
    return allProducts;
  }

  private async searchProducts(filter: string): Promise<JustoProduct[]> {
    const { data } = await firstValueFrom(
      this.httpService.post<JustoResponse>(
        TAMBO_CONFIG.graphqlUrl,
        {
          query: PRODUCTS_QUERY,
          variables: {
            websiteId: TAMBO_CONFIG.websiteId,
            menuId: TAMBO_CONFIG.menuId,
            filter,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          },
          timeout: 15000,
        },
      ),
    );

    return data?.data?.products?.items || [];
  }

  private parseProduct(product: JustoProduct): ScrapedProductData | null {
    // Get first available price entry
    const avail = product.availability?.find((a) => a.finalPrice > 0);
    if (!avail) return null;

    const price = avail.finalPrice;
    const listPrice = avail.basePrice;
    const isOnSale = listPrice > price && price > 0;
    const salePercentage = isOnSale
      ? Math.round(((listPrice - price) / listPrice) * 100)
      : 0;

    return {
      name: product.name,
      brand: 'Tambo',
      barcode: product._id, // Justo uses internal IDs, not barcodes
      price,
      listPrice,
      isAvailable: true,
      isOnSale,
      salePercentage,
      imageUrl: product.image?.url || '',
      productUrl: `https://www.tambo.pe`,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
