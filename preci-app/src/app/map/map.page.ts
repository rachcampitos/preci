import { Component, OnInit } from '@angular/core';
import { StoresService, Store } from '../core/services/stores.service';

interface StoreFilter {
  type: string;
  label: string;
  icon: string;
  active: boolean;
}

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
  standalone: false,
})
export class MapPage implements OnInit {
  stores: Store[] = [];
  isLoading = false;

  storeFilters: StoreFilter[] = [
    { type: 'supermercado', label: 'Super', icon: 'cart-outline', active: false },
    { type: 'mercado', label: 'Mercado', icon: 'storefront-outline', active: false },
    { type: 'bodega', label: 'Bodega', icon: 'home-outline', active: false },
    { type: 'minimarket', label: 'Mini', icon: 'basket-outline', active: false },
  ];

  constructor(private storesService: StoresService) {}

  ngOnInit() {
    this.loadNearbyStores();
  }

  toggleFilter(filter: StoreFilter) {
    filter.active = !filter.active;
    this.loadNearbyStores();
  }

  private loadNearbyStores() {
    this.isLoading = true;
    const activeFilter = this.storeFilters.find((f) => f.active);

    // Default: La Molina (se reemplazara con geolocation real)
    this.storesService
      .getNearby({
        latitude: -12.0769,
        longitude: -76.9427,
        radiusMeters: 5000,
        type: activeFilter?.type,
      })
      .subscribe({
        next: (stores) => {
          this.stores = stores;
          this.isLoading = false;
        },
        error: () => {
          this.stores = [];
          this.isLoading = false;
        },
      });
  }
}
