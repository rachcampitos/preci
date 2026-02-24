import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Store {
  _id: string;
  name: string;
  type: string;
  chain: string;
  address: string;
  district: string;
  location: { type: string; coordinates: [number, number] };
  isOnline: boolean;
  isVerified: boolean;
}

@Injectable({ providedIn: 'root' })
export class StoresService {
  constructor(private api: ApiService) {}

  getNearby(params: {
    latitude: number;
    longitude: number;
    radiusMeters?: number;
    type?: string;
    limit?: number;
  }): Observable<Store[]> {
    return this.api.get<Store[]>('/stores/nearby', {
      lat: params.latitude,
      lng: params.longitude,
      radius: params.radiusMeters || 5000,
      type: params.type,
      limit: params.limit || 20,
    });
  }

  getById(id: string): Observable<Store> {
    return this.api.get<Store>(`/stores/${id}`);
  }

  suggest(data: {
    name: string;
    type: string;
    latitude: number;
    longitude: number;
    address?: string;
    district?: string;
  }): Observable<Store> {
    return this.api.post<Store>('/stores/suggest', data);
  }
}
