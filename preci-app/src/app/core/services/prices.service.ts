import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PriceEntry {
  storeId: string;
  storeName: string;
  storeType: string;
  price: number;
  pricePerUnit?: number;
  isOnSale: boolean;
  source: 'crowdsourced' | 'scraped';
  reportedAt: string;
  distance?: number;
  confidence: number;
}

@Injectable({ providedIn: 'root' })
export class PricesService {
  constructor(private api: ApiService) {}

  getForProduct(productId: string): Observable<PriceEntry[]> {
    return this.api.get<PriceEntry[]>(`/prices/product/${productId}`);
  }
}
