import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PriceEntry {
  price: number;
  storeName: string;
  storeDistrict: string;
  storeType: string;
  source: 'crowdsourced' | 'scraped';
  reportedAt: string;
  confirmations?: number;
  isOnSale?: boolean;
}

export interface ProductPrices {
  product: {
    _id: string;
    name: string;
    brand: string;
    imageUrl?: string;
  };
  prices: PriceEntry[];
  bestPrice: number;
  worstPrice: number;
  averagePrice: number;
}

@Injectable({ providedIn: 'root' })
export class PricesService {
  constructor(private api: ApiService) {}

  getByProduct(productId: string, params?: {
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
  }): Observable<ProductPrices> {
    return this.api.get<ProductPrices>(`/prices/product/${productId}`, params);
  }

  getByBarcode(barcode: string, params?: {
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
  }): Observable<ProductPrices> {
    return this.api.get<ProductPrices>(`/prices/barcode/${barcode}`, params);
  }
}
