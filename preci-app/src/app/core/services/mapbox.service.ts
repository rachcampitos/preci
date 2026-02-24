import { Injectable } from '@angular/core';
import mapboxgl, { Map as MapboxMap, Marker, LngLatLike, NavigationControl } from 'mapbox-gl';
import { environment } from '../../../environments/environment';

export interface MapConfig {
  container: string | HTMLElement;
  center?: [number, number];
  zoom?: number;
  style?: string;
}

@Injectable({ providedIn: 'root' })
export class MapboxService {
  private map: MapboxMap | null = null;
  private markersMap = new Map<string, Marker>();
  private static cssLoaded = false;

  // Lima, Peru
  private defaultCenter: [number, number] = [-77.042793, -12.046374];
  private defaultZoom = 13;

  readonly styles = {
    streets: 'mapbox://styles/mapbox/streets-v12',
    light: 'mapbox://styles/mapbox/light-v11',
    dark: 'mapbox://styles/mapbox/dark-v11',
  };

  constructor() {
    mapboxgl.accessToken = environment.mapboxToken || '';
  }

  private loadCss(): void {
    if (MapboxService.cssLoaded) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.18.0/mapbox-gl.css';
    document.head.appendChild(link);
    MapboxService.cssLoaded = true;
  }

  initMap(config: MapConfig): MapboxMap {
    this.loadCss();
    if (this.map) {
      this.map.remove();
    }

    this.map = new mapboxgl.Map({
      container: config.container,
      style: config.style || this.styles.streets,
      center: config.center || this.defaultCenter,
      zoom: config.zoom || this.defaultZoom,
      attributionControl: false,
    });

    this.map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    this.map.addControl(new mapboxgl.AttributionControl({ compact: true }));

    return this.map;
  }

  getMap(): MapboxMap | null {
    return this.map;
  }

  addMarker(
    id: string,
    coordinates: [number, number],
    options?: {
      color?: string;
      element?: HTMLElement;
      popup?: string;
      onClick?: () => void;
    },
  ): Marker {
    this.removeMarker(id);

    let marker: Marker;
    if (options?.element) {
      marker = new Marker({ element: options.element, anchor: 'bottom' });
    } else {
      marker = new Marker({ color: options?.color || '#059669', anchor: 'bottom' });
    }

    marker.setLngLat(coordinates);

    if (options?.popup) {
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, closeOnClick: false }).setHTML(options.popup);
      marker.setPopup(popup);
    }

    if (options?.onClick) {
      const el = marker.getElement();
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        options.onClick!();
      });
    }

    if (this.map) {
      marker.addTo(this.map);
    }

    this.markersMap.set(id, marker);
    return marker;
  }

  removeMarker(id: string): void {
    const marker = this.markersMap.get(id);
    if (marker) {
      marker.remove();
      this.markersMap.delete(id);
    }
  }

  clearMarkers(): void {
    this.markersMap.forEach((m) => m.remove());
    this.markersMap.clear();
  }

  centerOn(coordinates: [number, number], zoom?: number): void {
    if (this.map) {
      this.map.flyTo({ center: coordinates, zoom: zoom || this.map.getZoom(), duration: 800 });
    }
  }

  fitBounds(coordinates: [number, number][], padding = 60): void {
    if (!this.map || coordinates.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach((c) => bounds.extend(c as LngLatLike));
    this.map.fitBounds(bounds, { padding });
  }

  getCenter(): [number, number] {
    if (!this.map) return this.defaultCenter;
    const { lng, lat } = this.map.getCenter();
    return [lng, lat];
  }

  getBoundsRadius(): number {
    if (!this.map) return 5000;
    const bounds = this.map.getBounds();
    if (!bounds) return 5000;
    const center = this.map.getCenter();
    const ne = bounds.getNorthEast();

    // Haversine distance from center to NE corner
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(ne.lat - center.lat);
    const dLng = toRad(ne.lng - center.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(center.lat)) * Math.cos(toRad(ne.lat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  removeMarkersByPrefix(prefix: string): void {
    const toRemove: string[] = [];
    this.markersMap.forEach((_, key) => {
      if (key.startsWith(prefix)) toRemove.push(key);
    });
    toRemove.forEach((key) => this.removeMarker(key));
  }

  setStyle(style: keyof typeof this.styles): void {
    if (this.map) {
      this.map.setStyle(this.styles[style]);
    }
  }

  destroy(): void {
    this.clearMarkers();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
