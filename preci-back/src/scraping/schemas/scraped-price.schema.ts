import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'scraped_prices',
  toJSON: { virtuals: true, versionKey: false },
})
export class ScrapedPrice {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
  storeId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop()
  previousPrice: number;

  @Prop()
  pricePerUnit: number;

  @Prop()
  originalName: string;

  @Prop()
  originalUrl: string;

  @Prop()
  originalImageUrl: string;

  @Prop({ default: false })
  isAvailable: boolean;

  @Prop({ default: false })
  isOnSale: boolean;

  @Prop()
  salePercentage: number;

  @Prop()
  scrapedAt: Date;

  @Prop({ default: true })
  isLatest: boolean;
}

export type ScrapedPriceDocument = HydratedDocument<ScrapedPrice>;
export const ScrapedPriceSchema = SchemaFactory.createForClass(ScrapedPrice);

ScrapedPriceSchema.index({ productId: 1, storeId: 1, isLatest: 1 });
ScrapedPriceSchema.index({ productId: 1, scrapedAt: -1 });
ScrapedPriceSchema.index({ storeId: 1, scrapedAt: -1 });
ScrapedPriceSchema.index(
  { scrapedAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);
