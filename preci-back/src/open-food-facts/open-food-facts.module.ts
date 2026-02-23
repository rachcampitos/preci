import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { OpenFoodFactsService } from './open-food-facts.service';

@Module({
  imports: [
    HttpModule.register({ timeout: 5000 }),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  providers: [OpenFoodFactsService],
  exports: [OpenFoodFactsService],
})
export class OpenFoodFactsModule {}
