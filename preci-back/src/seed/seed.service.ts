import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Store, StoreDocument } from '../stores/schemas/store.schema';
import { SEED_PRODUCTS } from './data/products.seed';
import { SEED_STORES } from './data/stores.seed';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Store.name)
    private readonly storeModel: Model<StoreDocument>,
  ) {}

  async seed(): Promise<void> {
    await this.seedProducts();
    await this.seedStores();
    this.logger.log('Seed completado');
  }

  private async seedProducts(): Promise<void> {
    const existing = await this.productModel.countDocuments();
    if (existing > 0) {
      this.logger.log(`Ya existen ${existing} productos, saltando seed de productos`);
      return;
    }

    const products = SEED_PRODUCTS.map((p) => ({
      ...p,
      isVerified: true,
      isActive: true,
    }));

    const result = await this.productModel.insertMany(products);
    this.logger.log(`${result.length} productos insertados`);
  }

  private async seedStores(): Promise<void> {
    const existing = await this.storeModel.countDocuments();
    if (existing > 0) {
      this.logger.log(`Ya existen ${existing} tiendas, saltando seed de tiendas`);
      return;
    }

    const stores = SEED_STORES.map((s) => ({
      ...s,
      isActive: true,
    }));

    const result = await this.storeModel.insertMany(stores);
    this.logger.log(`${result.length} tiendas insertadas`);
  }
}
