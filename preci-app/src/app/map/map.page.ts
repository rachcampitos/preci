import { Component, OnInit, OnDestroy, AfterViewInit, NgZone } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { StoresService, Store } from '../core/services/stores.service';
import { MapboxService } from '../core/services/mapbox.service';
import { ThemeService } from '../core/services/theme.service';

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
export class MapPage implements OnInit, AfterViewInit, OnDestroy {
  stores: Store[] = [];
  isLoading = false;
  mapReady = false;
  locationError = '';

  // La Molina default (fallback if geolocation fails)
  userLat = -12.0769;
  userLng = -76.9427;

  storeFilters: StoreFilter[] = [
    { type: 'supermercado', label: 'Super', icon: 'cart-outline', active: false },
    { type: 'mercado', label: 'Mercado', icon: 'storefront-outline', active: false },
    { type: 'bodega', label: 'Bodega', icon: 'home-outline', active: false },
    { type: 'minimarket', label: 'Mini', icon: 'basket-outline', active: false },
  ];

  private readonly storeColors: Record<string, string> = {
    supermercado: '#1e3a5f',
    mercado: '#d97706',
    bodega: '#16a34a',
    minimarket: '#7c3aed',
    farmacia: '#dc2626',
    mayorista: '#0891b2',
    online: '#6366f1',
  };

  private destroy$ = new Subject<void>();

  constructor(
    private storesService: StoresService,
    private mapboxService: MapboxService,
    private themeService: ThemeService,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {
    this.getUserLocation();

    // React to theme changes
    this.themeService.darkModeChange$.pipe(takeUntil(this.destroy$)).subscribe((isDark) => {
      if (this.mapReady) {
        this.mapboxService.setStyle(isDark ? 'dark' : 'streets');
        const map = this.mapboxService.getMap();
        if (map) {
          map.once('style.load', () => {
            this.addUserMarker();
            this.addStoreMarkers();
          });
        }
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 150);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.mapboxService.destroy();
  }

  private initMap() {
    const isDark = this.themeService.isDark();
    const map = this.mapboxService.initMap({
      container: 'preci-map',
      center: [this.userLng, this.userLat],
      zoom: 13,
      style: isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12',
    });

    map.on('load', () => {
      this.mapReady = true;
      this.addUserMarker();
      if (this.stores.length > 0) {
        this.addStoreMarkers();
      }
    });
  }

  private addUserMarker() {
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.innerHTML = '<div class="pulse"></div><div class="dot"></div>';
    this.mapboxService.addMarker('user', [this.userLng, this.userLat], { element: el });
  }

  private addStoreMarkers() {
    // Keep user marker, remove store markers
    this.stores.forEach((store) => {
      if (!store.location?.coordinates) return;
      const [lng, lat] = store.location.coordinates;
      const color = this.storeColors[store.type] || '#16a34a';

      this.mapboxService.addMarker(`store-${store._id}`, [lng, lat], {
        color,
        popup: `
          <div style="font-family: Inter, sans-serif; padding: 4px 0;">
            <strong style="font-size: 14px;">${store.name}</strong><br/>
            <span style="font-size: 12px; color: #64748b;">${store.district} &middot; ${store.type}</span>
          </div>
        `,
      });
    });
  }

  toggleFilter(filter: StoreFilter) {
    this.storeFilters.forEach((f) => {
      if (f !== filter) f.active = false;
    });
    filter.active = !filter.active;
    this.loadNearbyStores();
  }

  centerOnUser() {
    this.getUserLocation();
    this.mapboxService.centerOn([this.userLng, this.userLat], 13);
  }

  private getUserLocation() {
    if (!navigator.geolocation) {
      this.locationError = 'Geolocalización no disponible';
      this.loadNearbyStores();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.ngZone.run(() => {
          this.userLat = position.coords.latitude;
          this.userLng = position.coords.longitude;
          this.locationError = '';
          this.loadNearbyStores();
          if (this.mapReady) {
            this.mapboxService.centerOn([this.userLng, this.userLat], 13);
            this.addUserMarker();
          }
        });
      },
      (error) => {
        this.ngZone.run(() => {
          console.warn('Geolocation error:', error.message);
          this.locationError = 'No se pudo obtener tu ubicación';
          // Use default La Molina coordinates
          this.loadNearbyStores();
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  fitAllStores() {
    const coords = this.stores
      .filter((s) => s.location?.coordinates)
      .map((s) => s.location.coordinates as [number, number]);
    if (coords.length > 0) {
      this.mapboxService.fitBounds(coords);
    }
  }

  getStoreIcon(type: string): string {
    const icons: Record<string, string> = {
      supermercado: 'cart-outline',
      mercado: 'storefront-outline',
      bodega: 'home-outline',
      minimarket: 'basket-outline',
      farmacia: 'medkit-outline',
      mayorista: 'cube-outline',
      online: 'globe-outline',
    };
    return icons[type] || 'storefront-outline';
  }

  goToStore(store: Store) {
    if (!store.location?.coordinates) return;
    const [lng, lat] = store.location.coordinates;
    this.mapboxService.centerOn([lng, lat], 15);
  }

  private loadNearbyStores() {
    this.isLoading = true;
    const activeFilter = this.storeFilters.find((f) => f.active);

    this.storesService
      .getNearby({
        latitude: this.userLat,
        longitude: this.userLng,
        radiusMeters: 10000,
        type: activeFilter?.type,
      })
      .subscribe({
        next: (stores) => {
          this.stores = stores;
          this.isLoading = false;
          if (this.mapReady) {
            this.addStoreMarkers();
          }
        },
        error: () => {
          this.stores = [];
          this.isLoading = false;
        },
      });
  }
}
