import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum PriceReportStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FLAGGED = 'flagged',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Schema({
  timestamps: true,
  collection: 'price_reports',
  toJSON: { virtuals: true, versionKey: false },
})
export class PriceReport {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
  storeId: Types.ObjectId;

  @Prop({ required: true, min: 0.01 })
  price: number;

  @Prop()
  pricePerUnit: number;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  reportedByUserId: Types.ObjectId;

  @Prop()
  anonymousSessionId: string;

  @Prop({
    type: String,
    enum: PriceReportStatus,
    default: PriceReportStatus.PENDING,
    index: true,
  })
  status: PriceReportStatus;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: [Number],
  })
  reportLocation: { type: string; coordinates: [number, number] };

  @Prop()
  distanceFromStore: number;

  @Prop({ default: false })
  isOnSale: boolean;

  @Prop()
  saleEndsAt: Date;

  @Prop()
  notes: string;

  @Prop()
  imageUrl: string;

  @Prop({ default: 0 })
  confirmations: number;

  @Prop({ default: 0 })
  disputes: number;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  confirmedByUserIds: Types.ObjectId[];

  @Prop()
  expiresAt: Date;
}

export type PriceReportDocument = HydratedDocument<PriceReport>;
export const PriceReportSchema = SchemaFactory.createForClass(PriceReport);

PriceReportSchema.index({ productId: 1, storeId: 1, status: 1 });
PriceReportSchema.index({ productId: 1, createdAt: -1 });
PriceReportSchema.index({ storeId: 1, createdAt: -1 });
PriceReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PriceReportSchema.index({ reportLocation: '2dsphere' });

PriceReportSchema.pre('save', function () {
  if (this.isNew) {
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    this.expiresAt = new Date(Date.now() + thirtyDays);
  }
});
