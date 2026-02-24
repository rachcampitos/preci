import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum StoreType {
  BODEGA = 'bodega',
  MERCADO = 'mercado',
  SUPERMERCADO = 'supermercado',
  MINIMARKET = 'minimarket',
  FARMACIA = 'farmacia',
  MAYORISTA = 'mayorista',
  ONLINE = 'online',
}

export enum StoreChain {
  PLAZA_VEA = 'plaza_vea',
  TOTTUS = 'tottus',
  METRO = 'metro',
  WONG = 'wong',
  VIVANDA = 'vivanda',
  TAMBO = 'tambo',
  MASS = 'mass',
  MAKRO = 'makro',
  OXXO = 'oxxo',
  LISTO = 'listo',
  REPSHOP = 'repshop',
  INDEPENDENT = 'independent',
}

interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

@Schema({
  timestamps: true,
  collection: 'stores',
  toJSON: { virtuals: true, versionKey: false },
})
export class Store {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, enum: StoreType, required: true, index: true })
  type: StoreType;

  @Prop({ type: String, enum: StoreChain, default: StoreChain.INDEPENDENT })
  chain: StoreChain;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: GeoPoint;

  @Prop({ trim: true })
  address: string;

  @Prop({ trim: true, index: true })
  district: string;

  @Prop({ trim: true })
  province: string;

  @Prop()
  phone: string;

  @Prop()
  websiteUrl: string;

  @Prop()
  scrapingBaseUrl: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  addedByUserId: string;

  @Prop({ default: 0 })
  totalPriceReports: number;

  @Prop()
  lastScrapedAt: Date;

  @Prop({ default: 0 })
  reportCount: number;
}

export type StoreDocument = HydratedDocument<Store>;
export const StoreSchema = SchemaFactory.createForClass(Store);

StoreSchema.index({ location: '2dsphere' });
StoreSchema.index({ district: 1, isActive: 1 });
StoreSchema.index({ type: 1, isActive: 1 });
StoreSchema.index({ chain: 1 });
