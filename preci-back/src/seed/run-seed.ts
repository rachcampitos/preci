import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Store, StoreSchema } from '../stores/schemas/store.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URL || 'mongodb://localhost:27017/preci'),
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Store.name, schema: StoreSchema },
    ]),
  ],
  providers: [SeedService],
})
class SeedAppModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedAppModule);
  const seedService = app.get(SeedService);
  await seedService.seed();
  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Seed fallo:', err);
  process.exit(1);
});
