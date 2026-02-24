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
  'leche', 'leche evaporada', 'yogurt', 'queso', 'mantequilla', 'crema de leche',
  'manjar', 'leche condensada',
  // Carnes y proteinas
  'pollo', 'carne', 'cerdo', 'huevos', 'jamon', 'salchicha', 'chorizo',
  'hamburguesa', 'pescado', 'atun', 'sardina', 'tocino', 'pavo',
  // Frutas y verduras
  'papa', 'cebolla', 'tomate', 'limon', 'platano', 'manzana', 'naranja',
  'zanahoria', 'palta', 'lechuga', 'pepino', 'brocoli', 'pimiento',
  'mandarina', 'uva', 'fresa', 'sandia', 'camote', 'choclo',
  // Granos, cereales y pastas
  'arroz', 'fideos', 'avena', 'pan', 'pan de molde', 'harina', 'lenteja',
  'frijol', 'quinua', 'cereal', 'granola', 'spaghetti', 'tallarin',
  // Panaderia y snacks
  'galleta', 'galletas', 'chocolate', 'caramelo', 'wafer', 'paneton',
  'snack', 'papas fritas', 'doritos', 'piqueo',
  // Bebidas
  'agua', 'gaseosa', 'jugo', 'cerveza', 'vino', 'pisco', 'cafe',
  'te', 'infusion', 'nectar', 'energizante', 'chicha', 'refresco',
  // Limpieza
  'detergente', 'lejia', 'jabon', 'suavizante', 'lavavajilla', 'desinfectante',
  'papel higienico', 'servilleta', 'bolsa basura', 'esponja', 'limpiador',
  // Higiene personal
  'shampoo', 'crema dental', 'desodorante', 'toalla higienica', 'panal',
  'acondicionador', 'gel de bano',
  // Aceites y basicos
  'aceite', 'aceite de oliva', 'azucar', 'sal', 'vinagre', 'margarina',
  // Enlatados y salsas
  'conserva', 'salsa de tomate', 'ketchup', 'mayonesa', 'mostaza',
  'sopa instantanea',
  // Marcas populares (capturan productos que no aparecen por generico)
  'gloria', 'laive', 'bimbo', 'alicorp', 'molitalia', 'ajinomoto',
  'nestle', 'colgate', 'protex', 'bolivar', 'sapolio', 'suave',
  'coca cola', 'inca kola', 'san luis', 'backus', 'pilsen',
];

export class VtexScraper {
  private readonly logger = new Logger(VtexScraper.name);

  constructor(private readonly httpService: HttpService) {}

  async scrapeStore(config: VtexStoreConfig): Promise<ScrapedProductData[]> {
    const allProducts: ScrapedProductData[] = [];
    const seenIds = new Set<string>();

    for (const term of SEARCH_TERMS) {
      try {
        // Paginate: fetch up to 3 pages of 50 results each (150 per term)
        for (let page = 0; page < 3; page++) {
          const from = page * 50;
          const to = from + 49;
          const products = await this.searchProducts(config, term, from, to);

          let newInPage = 0;
          for (const p of products) {
            const key = `${p.barcode}-${p.price}`;
            if (!seenIds.has(key) && p.barcode) {
              seenIds.add(key);
              allProducts.push(p);
              newInPage++;
            }
          }

          // Stop paginating if page returned fewer than 50 results (no more data)
          if (products.length < 50) break;
          // Stop if all results were duplicates
          if (newInPage === 0) break;

          await this.delay(400);
        }
        // Respect rate limits between terms
        await this.delay(400);
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
