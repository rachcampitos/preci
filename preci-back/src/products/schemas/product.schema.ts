import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum ProductUnit {
  KG = 'kg',
  G = 'g',
  ML = 'ml',
  L = 'l',
  UN = 'unidad',
  PACK = 'pack',
}

export enum ProductCategory {
  LACTEOS = 'lacteos',
  CARNES = 'carnes',
  FRUTAS_VERDURAS = 'frutas_verduras',
  GRANOS_CEREALES = 'granos_cereales',
  BEBIDAS = 'bebidas',
  LIMPIEZA = 'limpieza',
  HIGIENE = 'higiene',
  PANADERIA = 'panaderia',
  ENLATADOS = 'enlatados',
  ACEITES = 'aceites',
}

@Schema({
  timestamps: true,
  collection: 'products',
  toJSON: { virtuals: true, versionKey: false },
})
export class Product {
  @Prop({ required: true, unique: true, index: true })
  barcode: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  brand: string;

  @Prop({ type: String, enum: ProductCategory, index: true })
  category: ProductCategory;

  @Prop({ type: String, enum: ProductUnit, default: ProductUnit.UN })
  unit: ProductUnit;

  @Prop()
  unitSize: number;

  @Prop()
  imageUrl: string;

  @Prop()
  imagePublicId: string;

  @Prop({ type: Object })
  openFoodFactsData: Record<string, any>;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isMvpBasket: boolean;

  @Prop({ default: 0 })
  totalPriceReports: number;

  @Prop()
  lowestPriceEver: number;

  @Prop()
  averagePrice: number;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ name: 'text', brand: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ isMvpBasket: 1 });
