import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PriceReport,
  PriceReportDocument,
  PriceReportStatus,
} from './schemas/price-report.schema';
import { StoresService } from '../stores/stores.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class PriceReportsService {
  private readonly logger = new Logger(PriceReportsService.name);

  constructor(
    @InjectModel(PriceReport.name)
    private readonly priceReportModel: Model<PriceReportDocument>,
    private readonly storesService: StoresService,
    private readonly gamificationService: GamificationService,
  ) {}

  async create(data: {
    productId: string;
    storeId: string;
    price: number;
    latitude: number;
    longitude: number;
    userId?: string;
    anonymousSessionId?: string;
    isOnSale?: boolean;
    notes?: string;
    imageUrl?: string;
  }): Promise<PriceReportDocument> {
    const store = await this.storesService.findById(data.storeId);

    // Calcular distancia del usuario a la tienda
    const storeCoords = (store.location as any).coordinates;
    const distance = this.calculateDistance(
      data.latitude,
      data.longitude,
      storeCoords[1],
      storeCoords[0],
    );

    const status =
      distance > 500
        ? PriceReportStatus.FLAGGED
        : PriceReportStatus.PENDING;

    const report = await this.priceReportModel.create({
      productId: new Types.ObjectId(data.productId),
      storeId: new Types.ObjectId(data.storeId),
      price: data.price,
      reportedByUserId: data.userId
        ? new Types.ObjectId(data.userId)
        : undefined,
      anonymousSessionId: data.anonymousSessionId,
      status,
      reportLocation: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      },
      distanceFromStore: Math.round(distance),
      isOnSale: data.isOnSale || false,
      notes: data.notes,
      imageUrl: data.imageUrl,
    });

    // Dar puntos al usuario si esta autenticado
    if (data.userId) {
      await this.gamificationService.addPoints(data.userId, 10, 'price_report');
    }

    return report;
  }

  async getRecentByProduct(
    productId: string,
    limit = 20,
  ): Promise<PriceReportDocument[]> {
    return this.priceReportModel
      .find({
        productId: new Types.ObjectId(productId),
        status: { $in: [PriceReportStatus.PENDING, PriceReportStatus.VERIFIED] },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('storeId')
      .lean();
  }

  async confirmReport(
    reportId: string,
    userId: string,
  ): Promise<PriceReportDocument> {
    const report = await this.priceReportModel.findByIdAndUpdate(
      reportId,
      {
        $inc: { confirmations: 1 },
        $addToSet: { confirmedByUserIds: new Types.ObjectId(userId) },
      },
      { new: true },
    );

    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    // Auto-verificar si tiene 2+ confirmaciones
    if (report.confirmations >= 2) {
      report.status = PriceReportStatus.VERIFIED;
      await report.save();
    }

    await this.gamificationService.addPoints(userId, 5, 'confirmation');

    return report;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
