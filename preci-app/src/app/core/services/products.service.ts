import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Product {
  _id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  unitSize: number;
  imageUrl?: string;
  isMvpBasket: boolean;
  averagePrice?: number;
  lowestPriceEver?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  constructor(private api: ApiService) {}

  getByBarcode(barcode: string): Observable<Product> {
    return this.api.get<Product>(`/products/barcode/${barcode}`);
  }

  search(query: string, limit = 20): Observable<Product[]> {
    return this.api.get<Product[]>('/products/search', { q: query, limit });
  }

  getBasket(): Observable<Product[]> {
    return this.api.get<Product[]>('/products/basket');
  }

  getPopular(limit = 30, category?: string): Observable<Product[]> {
    const params: any = { limit };
    if (category) params.category = category;
    return this.api.get<Product[]>('/products/popular', params);
  }

  getById(id: string): Observable<Product> {
    return this.api.get<Product>(`/products/${id}`);
  }
}
