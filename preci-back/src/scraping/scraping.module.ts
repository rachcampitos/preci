import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ScrapedPrice,
  ScrapedPriceSchema,
} from './schemas/scraped-price.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { ScrapingService } from './scraping.service';

@Module({
  imports: [
    HttpModule.register({ timeout: 15000 }),
    MongooseModule.forFeature([
      { name: ScrapedPrice.name, schema: ScrapedPriceSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  providers: [ScrapingService],
  exports: [ScrapingService],
})
export class ScrapingModule {}
