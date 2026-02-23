/**
 * Seed script para generar price reports de ejemplo.
 * Crea ~200 reportes de precios para los productos existentes en tiendas existentes.
 *
 * Uso: npx ts-node -r tsconfig-paths/register src/seed/seed-prices.ts
 */
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule, InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import {
  PriceReport,
  PriceReportSchema,
  PriceReportStatus,
} from '../price-reports/schemas/price-report.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Store, StoreSchema } from '../stores/schemas/store.schema';

// Precios base realistas por categoria (en soles) — rango [min, max]
const PRICE_RANGES: Record<string, [number, number]> = {
  lacteos:          [3.50, 9.80],
  carnes:           [8.50, 32.00],
  frutas_verduras:  [2.00, 8.50],
  granos_cereales:  [2.50, 22.00],
  aceites:          [8.50, 16.00],
  enlatados:        [3.50, 8.50],
  bebidas:          [1.50, 14.00],
  limpieza:         [3.00, 12.50],
  higiene:          [5.00, 18.00],
  panaderia:        [0.15, 0.50],
};

function randomBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function randomDate(daysBack: number): Date {
  const now = Date.now();
  const offset = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

@Injectable()
class PriceSeedService {
  constructor(
    @InjectModel(PriceReport.name) private priceReportModel: Model<any>,
    @InjectModel(Product.name) private productModel: Model<any>,
    @InjectModel(Store.name) private storeModel: Model<any>,
  ) {}

  async seed(): Promise<void> {
    const existingReports = await this.priceReportModel.countDocuments();
    if (existingReports > 0) {
      console.log(`Ya existen ${existingReports} price reports, saltando seed`);
      return;
    }

    const products = await this.productModel.find({ isMvpBasket: true }).lean();
    const stores = await this.storeModel.find({ isActive: true }).lean();

    if (products.length === 0 || stores.length === 0) {
      console.log('No hay productos o tiendas. Ejecuta el seed principal primero.');
      return;
    }

    const reports: any[] = [];

    for (const product of products) {
      const category = product.category || 'granos_cereales';
      const [minPrice, maxPrice] = PRICE_RANGES[category] || [3.00, 15.00];

      // Generar un precio base para este producto
      const basePrice = randomBetween(minPrice, maxPrice);

      // Elegir 2-5 tiendas aleatorias para cada producto
      const numStores = Math.min(stores.length, 2 + Math.floor(Math.random() * 4));
      const shuffled = [...stores].sort(() => Math.random() - 0.5);
      const selectedStores = shuffled.slice(0, numStores);

      for (const store of selectedStores) {
        // Variacion de precio: +/- 15% respecto al base
        const variation = 0.85 + Math.random() * 0.30; // 0.85 a 1.15
        const price = Math.round(basePrice * variation * 100) / 100;

        const storeCoords = store.location?.coordinates || [-77.0428, -12.0464];
        // Simular ubicacion cercana a la tienda (100-300m)
        const lat = storeCoords[1] + (Math.random() - 0.5) * 0.003;
        const lng = storeCoords[0] + (Math.random() - 0.5) * 0.003;

        const confirmations = Math.floor(Math.random() * 5);
        const isOnSale = Math.random() < 0.15; // 15% de chance

        reports.push({
          productId: new Types.ObjectId(product._id),
          storeId: new Types.ObjectId(store._id),
          price: isOnSale ? Math.round(price * 0.85 * 100) / 100 : price,
          status:
            confirmations >= 2
              ? PriceReportStatus.VERIFIED
              : PriceReportStatus.PENDING,
          reportLocation: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          distanceFromStore: Math.floor(50 + Math.random() * 250),
          isOnSale,
          confirmations,
          createdAt: randomDate(14), // ultimos 14 dias
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      }
    }

    const result = await this.priceReportModel.insertMany(reports);
    console.log(`${result.length} price reports insertados`);

    // Actualizar averagePrice y lowestPriceEver en productos
    for (const product of products) {
      const productReports = reports.filter(
        (r) => r.productId.toString() === product._id.toString(),
      );
      if (productReports.length === 0) continue;

      const prices = productReports.map((r) => r.price);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const lowest = Math.min(...prices);

      await this.productModel.updateOne(
        { _id: product._id },
        {
          $set: {
            averagePrice: Math.round(avg * 100) / 100,
            lowestPriceEver: lowest,
            totalPriceReports: productReports.length,
          },
        },
      );
    }
    console.log('Precios promedio y minimos actualizados en productos');
  }
}

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGO_URL || 'mongodb://localhost:27017/preci',
    ),
    MongooseModule.forFeature([
      { name: PriceReport.name, schema: PriceReportSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Store.name, schema: StoreSchema },
    ]),
  ],
  providers: [PriceSeedService],
})
class PriceSeedModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(PriceSeedModule);
  const service = app.get(PriceSeedService);
  await service.seed();
  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Price seed fallo:', err);
  process.exit(1);
});
