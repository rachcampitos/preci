import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ShoppingList,
  ShoppingListSchema,
} from './schemas/shopping-list.schema';
import { ShoppingListsService } from './shopping-lists.service';
import { ShoppingListsController } from './shopping-lists.controller';
import { PricesModule } from '../prices/prices.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShoppingList.name, schema: ShoppingListSchema },
    ]),
    PricesModule,
    ProductsModule,
  ],
  controllers: [ShoppingListsController],
  providers: [ShoppingListsService],
  exports: [ShoppingListsService],
})
export class ShoppingListsModule {}
