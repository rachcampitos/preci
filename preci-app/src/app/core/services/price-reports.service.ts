import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CreatePriceReport {
  productId: string;
  storeId: string;
  price: number;
  latitude: number;
  longitude: number;
  isOnSale?: boolean;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class PriceReportsService {
  constructor(private api: ApiService) {}

  create(report: CreatePriceReport): Observable<any> {
    return this.api.post('/price-reports', report);
  }

  confirm(reportId: string): Observable<any> {
    return this.api.post(`/price-reports/${reportId}/confirm`, {});
  }

  dispute(reportId: string): Observable<any> {
    return this.api.post(`/price-reports/${reportId}/dispute`, {});
  }
}
