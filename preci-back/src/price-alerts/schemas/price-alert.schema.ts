import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'price_alerts',
  toJSON: { virtuals: true, versionKey: false },
})
export class PriceAlert {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ required: true, min: 0.01 })
  targetPrice: number;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop()
  lastTriggeredAt: Date;

  @Prop({ default: 0 })
  timesTriggered: number;

  @Prop({ type: Types.ObjectId, ref: 'Store' })
  storeId: Types.ObjectId;

  @Prop()
  latitude: number;

  @Prop()
  longitude: number;

  @Prop({ default: 5 })
  radiusKm: number;
}

export type PriceAlertDocument = HydratedDocument<PriceAlert>;
export const PriceAlertSchema = SchemaFactory.createForClass(PriceAlert);

PriceAlertSchema.index({ isActive: 1, productId: 1 });
