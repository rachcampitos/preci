import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Store, StoreDocument, StoreType } from './schemas/store.schema';

@Injectable()
export class StoresService {
  constructor(
    @InjectModel(Store.name)
    private readonly storeModel: Model<StoreDocument>,
  ) {}

  async findNearby(params: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    type?: StoreType;
    limit?: number;
  }): Promise<StoreDocument[]> {
    const query: any = {
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [params.longitude, params.latitude],
          },
          $maxDistance: params.radiusMeters,
        },
      },
    };

    if (params.type) {
      query.type = params.type;
    }

    return this.storeModel
      .find(query)
      .limit(params.limit || 20)
      .lean();
  }

  async findById(id: string): Promise<StoreDocument> {
    const store = await this.storeModel.findById(id);
    if (!store) {
      throw new NotFoundException('Tienda no encontrada');
    }
    return store;
  }

  async create(data: Partial<Store>): Promise<StoreDocument> {
    return this.storeModel.create(data);
  }

  async suggestStore(data: {
    name: string;
    type: StoreType;
    latitude: number;
    longitude: number;
    address?: string;
    district?: string;
  }): Promise<StoreDocument> {
    // Check for duplicate within 100m
    const existing = await this.storeModel.findOne({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [data.longitude, data.latitude],
          },
          $maxDistance: 100,
        },
      },
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
    });

    if (existing) {
      return existing;
    }

    return this.storeModel.create({
      name: data.name.trim(),
      type: data.type,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      },
      address: data.address?.trim(),
      district: data.district?.trim(),
      isActive: true,
      isVerified: false,
      chain: 'independent',
    });
  }
}
