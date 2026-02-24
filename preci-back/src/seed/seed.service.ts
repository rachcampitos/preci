import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Store, StoreDocument } from '../stores/schemas/store.schema';
import { SEED_PRODUCTS } from './data/products.seed';
import { SEED_STORES } from './data/stores.seed';
import { fetchStoresFromOSM } from './osm-store-seeder';

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
    await this.seedStoresFromOSM();
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

  async seedStoresFromOSM(): Promise<{ inserted: number; skipped: number }> {
    this.logger.log('Descargando tiendas de OpenStreetMap...');

    let osmStores;
    try {
      osmStores = await fetchStoresFromOSM();
    } catch (err) {
      this.logger.error(`Error descargando datos OSM: ${err}`);
      return { inserted: 0, skipped: 0 };
    }

    this.logger.log(`${osmStores.length} tiendas encontradas en OSM`);

    let inserted = 0;
    let skipped = 0;

    for (const store of osmStores) {
      // Check for duplicate: same chain within 100m
      const duplicate = await this.storeModel.findOne({
        chain: store.chain,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [store.longitude, store.latitude],
            },
            $maxDistance: 100,
          },
        },
      });

      if (duplicate) {
        skipped++;
        continue;
      }

      await this.storeModel.create({
        name: store.name,
        type: store.type,
        chain: store.chain,
        location: {
          type: 'Point',
          coordinates: [store.longitude, store.latitude],
        },
        address: store.address,
        district: store.district,
        province: store.province,
        isOnline: false,
        isActive: true,
        isVerified: true,
      });
      inserted++;
    }

    this.logger.log(`OSM seed: ${inserted} insertadas, ${skipped} duplicadas omitidas`);
    return { inserted, skipped };
  }
}
