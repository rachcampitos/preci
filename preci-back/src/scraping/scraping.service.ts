import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ScrapedPrice,
  ScrapedPriceDocument,
} from './schemas/scraped-price.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Store, StoreDocument } from '../stores/schemas/store.schema';
import {
  VtexScraper,
  VTEX_STORES,
  ScrapedProductData,
  VtexStoreConfig,
} from './scrapers/vtex.scraper';
import { TamboScraper } from './scrapers/tambo.scraper';
import { TottusScraper } from './scrapers/tottus.scraper';
import { categorizeProduct } from '../products/product-categorizer';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);
  private readonly vtexScraper: VtexScraper;
  private readonly tamboScraper: TamboScraper;
  private readonly tottusScraper: TottusScraper;
  private isRunning = false;

  constructor(
    @InjectModel(ScrapedPrice.name)
    private readonly scrapedPriceModel: Model<ScrapedPriceDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Store.name)
    private readonly storeModel: Model<StoreDocument>,
    private readonly httpService: HttpService,
  ) {
    this.vtexScraper = new VtexScraper(this.httpService);
    this.tamboScraper = new TamboScraper(this.httpService);
    this.tottusScraper = new TottusScraper(this.httpService);
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async scrapeAllSupermarkets() {
    if (this.isRunning) {
      this.logger.warn('Scraping already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    this.logger.log('Iniciando scraping de supermercados...');

    try {
      for (const storeConfig of VTEX_STORES) {
        await this.scrapeVtexStore(storeConfig);
      }
      await this.scrapeTamboStore();
      await this.scrapeTottusStore();
      this.logger.log('Scraping completado');
    } catch (err) {
      this.logger.error(`Scraping failed: ${err.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scrapeBasketProducts() {
    const basketProducts = await this.productModel.find({
      isMvpBasket: true,
      isActive: true,
    });

    if (basketProducts.length === 0) return;

    this.logger.log(
      `Scraping ${basketProducts.length} productos de canasta basica`,
    );

    for (const storeConfig of VTEX_STORES) {
      for (const product of basketProducts) {
        try {
          const results = await this.vtexScraper.searchProducts(
            storeConfig,
            product.name,
            0,
            4,
          );

          const onlineStore = await this.getOnlineStoreForChain(
            storeConfig.chain,
          );
          if (!onlineStore) continue;

          // Find best match by name similarity
          const match = results.find(
            (r) =>
              r.barcode === product.barcode ||
              r.name.toLowerCase().includes(product.name.toLowerCase()),
          );

          if (match) {
            await this.saveScrapedPrice(match, onlineStore._id, product._id);
          }

          await this.delay(300);
        } catch {
          // Skip this product/store combination
        }
      }
    }
  }

  /**
   * Trigger a manual scrape for a single store chain (for admin/testing)
   */
  async scrapeChain(chain: string): Promise<number> {
    if (chain === 'tambo') {
      return this.scrapeTamboStore();
    }
    if (chain === 'tottus') {
      return this.scrapeTottusStore();
    }
    const config = VTEX_STORES.find((s) => s.chain === chain);
    if (!config) {
      this.logger.warn(`No config for chain: ${chain}`);
      return 0;
    }
    return this.scrapeVtexStore(config);
  }

  async getLatestPrices(productId: string): Promise<ScrapedPriceDocument[]> {
    return this.scrapedPriceModel
      .find({ productId: new Types.ObjectId(productId), isLatest: true })
      .populate('storeId')
      .lean();
  }

  /**
   * Get prices for a product by barcode across all stores
   */
  async getPricesByBarcode(barcode: string): Promise<ScrapedPriceDocument[]> {
    const product = await this.productModel.findOne({ barcode });
    if (!product) return [];
    return this.getLatestPrices(product._id.toString());
  }

  // ─── PRIVATE ───────────────────────────────────────────────

  private async scrapeVtexStore(config: VtexStoreConfig): Promise<number> {
    this.logger.log(`Scraping ${config.storeLabel}...`);

    try {
      const products = await this.vtexScraper.scrapeStore(config);
      const onlineStore = await this.getOnlineStoreForChain(config.chain);

      if (!onlineStore) {
        this.logger.warn(
          `No online store found for chain: ${config.chain}`,
        );
        return 0;
      }

      let saved = 0;
      let skipped = 0;
      let errors = 0;
      for (const product of products) {
        try {
          const productDoc = await this.findOrCreateProduct(product);
          if (productDoc) {
            await this.saveScrapedPrice(
              product,
              onlineStore._id,
              productDoc._id,
            );
            saved++;
          } else {
            skipped++;
          }
        } catch (err) {
          errors++;
          if (errors <= 3) {
            this.logger.warn(
              `Error saving product "${product.name}": ${err.message}`,
            );
          }
        }
      }
      this.logger.log(
        `${config.storeLabel}: skipped=${skipped}, errors=${errors}`,
      );

      // Update store's lastScrapedAt
      await this.storeModel.updateMany(
        { chain: config.chain },
        { $set: { lastScrapedAt: new Date() } },
      );

      this.logger.log(
        `${config.storeLabel}: saved ${saved}/${products.length} prices`,
      );
      return saved;
    } catch (err) {
      this.logger.error(
        `Failed to scrape ${config.storeLabel}: ${err.message}`,
      );
      return 0;
    }
  }

  private async findOrCreateProduct(
    data: ScrapedProductData,
  ): Promise<ProductDocument | null> {
    if (!data.barcode) return null;

    const category = categorizeProduct(data.name);

    // Use findOneAndUpdate with upsert to avoid race condition duplicates
    const product = await this.productModel.findOneAndUpdate(
      { barcode: data.barcode },
      {
        $setOnInsert: {
          barcode: data.barcode,
          name: data.name,
          brand: data.brand,
          isVerified: false,
          isActive: true,
        },
        $set: {
          ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
        },
      },
      { upsert: true, new: true },
    );

    // Auto-categorize if product has no category yet
    if (!product.category && category) {
      product.category = category;
      await product.save();
    }

    return product;
  }

  private async saveScrapedPrice(
    data: ScrapedProductData,
    storeId: Types.ObjectId,
    productId: Types.ObjectId,
  ): Promise<void> {
    // Mark previous latest prices as not latest
    await this.scrapedPriceModel.updateMany(
      { productId, storeId, isLatest: true },
      { $set: { isLatest: false } },
    );

    await this.scrapedPriceModel.create({
      productId,
      storeId,
      price: data.price,
      previousPrice: data.listPrice !== data.price ? data.listPrice : undefined,
      originalName: data.name,
      originalUrl: data.productUrl,
      originalImageUrl: data.imageUrl,
      isAvailable: data.isAvailable,
      isOnSale: data.isOnSale,
      salePercentage: data.salePercentage || undefined,
      scrapedAt: new Date(),
      isLatest: true,
    });

    // Update product stats
    const allLatest = await this.scrapedPriceModel
      .find({ productId, isLatest: true })
      .lean();

    if (allLatest.length > 0) {
      const prices = allLatest.map((p) => p.price);
      const avgPrice =
        prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const lowestPrice = Math.min(...prices);

      await this.productModel.updateOne(
        { _id: productId },
        {
          $set: { averagePrice: Math.round(avgPrice * 100) / 100 },
          $min: { lowestPriceEver: lowestPrice },
        },
      );
    }
  }

  private async scrapeTamboStore(): Promise<number> {
    this.logger.log('Scraping Tambo...');

    try {
      const products = await this.tamboScraper.scrapeStore();
      const onlineStore = await this.getOnlineStoreForChain('tambo');

      if (!onlineStore) {
        this.logger.warn('No online store found for chain: tambo');
        return 0;
      }

      let saved = 0;
      let errors = 0;
      for (const product of products) {
        try {
          const productDoc = await this.findOrCreateProduct(product);
          if (productDoc) {
            await this.saveScrapedPrice(
              product,
              onlineStore._id,
              productDoc._id,
            );
            saved++;
          }
        } catch (err) {
          errors++;
          if (errors <= 3) {
            this.logger.warn(
              `Error saving Tambo product "${product.name}": ${err.message}`,
            );
          }
        }
      }

      await this.storeModel.updateMany(
        { chain: 'tambo' },
        { $set: { lastScrapedAt: new Date() } },
      );

      this.logger.log(
        `Tambo: saved ${saved}/${products.length} prices (errors=${errors})`,
      );
      return saved;
    } catch (err) {
      this.logger.error(`Failed to scrape Tambo: ${err.message}`);
      return 0;
    }
  }

  private async scrapeTottusStore(): Promise<number> {
    this.logger.log('Scraping Tottus...');

    try {
      const products = await this.tottusScraper.scrapeStore();
      const onlineStore = await this.getOnlineStoreForChain('tottus');

      if (!onlineStore) {
        this.logger.warn('No online store found for chain: tottus');
        return 0;
      }

      let saved = 0;
      let errors = 0;
      for (const product of products) {
        try {
          const productDoc = await this.findOrCreateProduct(product);
          if (productDoc) {
            await this.saveScrapedPrice(
              product,
              onlineStore._id,
              productDoc._id,
            );
            saved++;
          }
        } catch (err) {
          errors++;
          if (errors <= 3) {
            this.logger.warn(
              `Error saving Tottus product "${product.name}": ${err.message}`,
            );
          }
        }
      }

      await this.storeModel.updateMany(
        { chain: 'tottus' },
        { $set: { lastScrapedAt: new Date() } },
      );

      this.logger.log(
        `Tottus: saved ${saved}/${products.length} prices (errors=${errors})`,
      );
      return saved;
    } catch (err) {
      this.logger.error(`Failed to scrape Tottus: ${err.message}`);
      return 0;
    }
  }

  private async getOnlineStoreForChain(
    chain: string,
  ): Promise<StoreDocument | null> {
    // Prefer online store, fallback to any store of that chain
    return this.storeModel.findOne({
      chain,
      isActive: true,
      $or: [{ isOnline: true }, { scrapingBaseUrl: { $exists: true, $ne: '' } }],
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
