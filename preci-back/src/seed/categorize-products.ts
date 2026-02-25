/**
 * Script para asignar categorias a productos sin categoria.
 * Usa la misma logica que el auto-categorizador del scraping service.
 *
 * Uso: npx ts-node -r tsconfig-paths/register src/seed/categorize-products.ts
 * Dry run: npx ts-node -r tsconfig-paths/register src/seed/categorize-products.ts --dry-run
 * Reset + re-run: npx ts-node -r tsconfig-paths/register src/seed/categorize-products.ts --reset
 */
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { categorizeProduct } from '../products/product-categorizer';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGO_URL || 'mongodb://localhost:27017/preci',
    ),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
})
class CategorizeModule {}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const reset = process.argv.includes('--reset');

  const app = await NestFactory.createApplicationContext(CategorizeModule, {
    logger: ['error', 'warn', 'log'],
  });
  const productModel = app.get<Model<any>>(getModelToken(Product.name));

  // Reset: clear all categories first (to re-run from scratch)
  if (reset) {
    const result = await productModel.updateMany(
      { category: { $exists: true } },
      { $unset: { category: '' } },
    );
    console.log(`Reset: ${result.modifiedCount} categorias eliminadas`);
  }

  const uncategorized = await productModel
    .find({ $or: [{ category: { $exists: false } }, { category: null }] })
    .select('name brand')
    .lean();

  console.log(`Productos sin categoria: ${uncategorized.length}`);

  const stats: Record<string, number> = {};
  let skipped = 0;
  let updated = 0;

  for (const product of uncategorized) {
    const category = categorizeProduct(product.name);
    if (!category) {
      skipped++;
      continue;
    }

    stats[category] = (stats[category] || 0) + 1;

    if (!dryRun) {
      await productModel.updateOne(
        { _id: product._id },
        { $set: { category } },
      );
    }
    updated++;
  }

  console.log(`\nResultados${dryRun ? ' (DRY RUN)' : ''}:`);
  console.log(`  Categorizados: ${updated}`);
  console.log(`  Sin match: ${skipped}`);
  console.log('\nPor categoria:');
  Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

  await app.close();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
