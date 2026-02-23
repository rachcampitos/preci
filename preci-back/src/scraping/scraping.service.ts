import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ScrapedPrice,
  ScrapedPriceDocument,
} from './schemas/scraped-price.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  constructor(
    @InjectModel(ScrapedPrice.name)
    private readonly scrapedPriceModel: Model<ScrapedPriceDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async scrapeAllSupermarkets() {
    this.logger.log('Iniciando scraping de supermercados...');
    // TODO: Implementar scrapers individuales
    // await this.scrapePlazaVea();
    // await this.scrapeTottus();
    // await this.scrapeMetro();
    // await this.scrapeWong();
    this.logger.log('Scraping completado');
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scrapeBasketProducts() {
    const basketProducts = await this.productModel.find({
      isMvpBasket: true,
      isActive: true,
    });
    this.logger.log(
      `Scraping ${basketProducts.length} productos de canasta basica`,
    );
    // TODO: Scrape solo productos de canasta basica
  }

  async getLatestPrices(productId: string): Promise<ScrapedPriceDocument[]> {
    return this.scrapedPriceModel
      .find({ productId, isLatest: true })
      .populate('storeId')
      .lean();
  }
}
