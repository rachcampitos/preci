import { Injectable } from '@nestjs/common';
import { PriceReportsService } from '../price-reports/price-reports.service';
import { ScrapingService } from '../scraping/scraping.service';

export interface PriceEntry {
  storeId: string;
  storeName: string;
  storeType: string;
  price: number;
  pricePerUnit?: number;
  isOnSale: boolean;
  source: 'crowdsourced' | 'scraped';
  reportedAt: Date;
  distance?: number;
  confidence: number;
}

@Injectable()
export class PricesService {
  constructor(
    private readonly priceReportsService: PriceReportsService,
    private readonly scrapingService: ScrapingService,
  ) {}

  async getPricesForProduct(productId: string): Promise<PriceEntry[]> {
    const [crowdsourced, scraped] = await Promise.all([
      this.priceReportsService.getRecentByProduct(productId),
      this.scrapingService.getLatestPrices(productId),
    ]);

    const prices: PriceEntry[] = [];

    // Mapear precios crowdsourced
    for (const report of crowdsourced) {
      const store = report.storeId as any;
      prices.push({
        storeId: store._id?.toString() || '',
        storeName: store.name || 'Tienda',
        storeType: store.type || 'bodega',
        price: report.price,
        pricePerUnit: report.pricePerUnit,
        isOnSale: report.isOnSale,
        source: 'crowdsourced',
        reportedAt: (report as any).createdAt,
        confidence: this.calculateConfidence(report.confirmations, report.disputes),
      });
    }

    // Mapear precios scraped
    for (const sp of scraped) {
      const store = sp.storeId as any;
      prices.push({
        storeId: store._id?.toString() || '',
        storeName: store.name || 'Tienda online',
        storeType: store.type || 'online',
        price: sp.price,
        pricePerUnit: sp.pricePerUnit,
        isOnSale: sp.isOnSale,
        source: 'scraped',
        reportedAt: sp.scrapedAt,
        confidence: 90, // Scraped = alta confianza
      });
    }

    // Ordenar por precio ascendente
    return prices.sort((a, b) => a.price - b.price);
  }

  private calculateConfidence(
    confirmations: number,
    disputes: number,
  ): number {
    if (confirmations >= 3 && disputes === 0) return 95;
    if (confirmations >= 2) return 80;
    if (confirmations >= 1) return 60;
    if (disputes > 0) return 30;
    return 50; // Precio nuevo sin confirmaciones
  }
}
