import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { StoresService, Store } from '../core/services/stores.service';
import { PriceReportsService, CreatePriceReport } from '../core/services/price-reports.service';
import { Product } from '../core/services/products.service';

@Component({
  selector: 'app-report-price-modal',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>Reportar precio</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()" aria-label="Cerrar">
            <ion-icon name="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- Producto -->
      <div class="report-product">
        <img *ngIf="product?.imageUrl" [src]="product!.imageUrl" class="report-product__img" />
        <div class="report-product__info">
          <span class="report-product__name">{{ product.name }}</span>
          <span class="report-product__brand" *ngIf="product?.brand">{{ product!.brand }}</span>
        </div>
      </div>

      <!-- Precio -->
      <div class="report-field">
        <label class="report-label">Precio que viste</label>
        <div class="price-input-wrapper">
          <span class="price-prefix">S/</span>
          <input
            type="number"
            inputmode="decimal"
            step="0.01"
            min="0.01"
            max="9999"
            [(ngModel)]="price"
            placeholder="0.00"
            class="price-input"
            #priceInput
          />
        </div>
      </div>

      <!-- Tienda -->
      <div class="report-field">
        <label class="report-label">Tienda</label>

        <!-- Buscando ubicacion -->
        <div class="location-status" *ngIf="isLoadingLocation">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <span>Obteniendo ubicacion...</span>
        </div>

        <!-- Error de ubicacion -->
        <div class="location-error" *ngIf="locationError">
          <ion-icon name="warning-outline"></ion-icon>
          <span>{{ locationError }}</span>
        </div>

        <!-- Lista de tiendas cercanas -->
        <div class="store-list" *ngIf="!isLoadingLocation && nearbyStores.length > 0">
          <button
            *ngFor="let store of nearbyStores"
            class="store-option"
            [class.store-option--selected]="selectedStore?._id === store._id"
            (click)="selectStore(store)"
          >
            <div class="store-option__icon" [ngClass]="'store-type--' + store.type">
              {{ store.name.charAt(0).toUpperCase() }}
            </div>
            <div class="store-option__info">
              <span class="store-option__name">{{ store.name }}</span>
              <span class="store-option__meta">{{ store.district }} &middot; {{ store.type }}</span>
            </div>
            <ion-icon name="checkmark-circle" class="store-option__check"
                      *ngIf="selectedStore?._id === store._id"></ion-icon>
          </button>
        </div>

        <!-- Sin tiendas -->
        <div class="no-stores" *ngIf="!isLoadingLocation && nearbyStores.length === 0 && !locationError">
          <ion-icon name="storefront-outline"></ion-icon>
          <span>No se encontraron tiendas cercanas</span>
        </div>
      </div>

      <!-- Es oferta? -->
      <div class="report-field report-field--inline">
        <label class="report-label">Es oferta o promocion?</label>
        <ion-toggle [(ngModel)]="isOnSale" color="primary"></ion-toggle>
      </div>

      <!-- Nota opcional -->
      <div class="report-field">
        <label class="report-label">Nota <span class="optional">(opcional)</span></label>
        <textarea
          [(ngModel)]="notes"
          placeholder="Ej: precio de etiqueta, vence pronto..."
          rows="2"
          class="note-input"
          maxlength="200"
        ></textarea>
      </div>

    </ion-content>

    <ion-footer class="ion-no-border">
      <ion-toolbar>
        <div class="submit-wrapper">
          <ion-button
            expand="block"
            color="primary"
            [disabled]="!canSubmit() || isSubmitting"
            (click)="submit()"
          >
            <ion-spinner *ngIf="isSubmitting" name="crescent" slot="start"></ion-spinner>
            <ion-icon *ngIf="!isSubmitting" name="checkmark-circle-outline" slot="start"></ion-icon>
            {{ isSubmitting ? 'Enviando...' : 'Reportar precio' }}
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    ion-toolbar {
      --background: var(--preci-surface);
      --color: var(--preci-text-primary);
    }

    ion-footer ion-toolbar {
      box-shadow: 0 -1px 3px rgba(0,0,0,0.06);
    }

    .submit-wrapper {
      padding: 8px 16px;
      padding-bottom: max(8px, env(safe-area-inset-bottom));
    }

    .report-product {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--preci-surface-alt);
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .report-product__img {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      object-fit: contain;
      background: var(--preci-surface);
      border: 1px solid var(--preci-border);
      padding: 4px;
    }

    .report-product__info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .report-product__name {
      font-size: 15px;
      font-weight: 600;
      color: var(--preci-text-primary);
      font-family: var(--preci-font);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .report-product__brand {
      font-size: 13px;
      color: var(--preci-text-tertiary);
      font-family: var(--preci-font);
    }

    .report-field {
      margin-bottom: 20px;
    }

    .report-field--inline {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .report-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--preci-text-secondary);
      font-family: var(--preci-font);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .report-field--inline .report-label {
      margin-bottom: 0;
    }

    .optional {
      font-weight: 400;
      text-transform: none;
      letter-spacing: 0;
      color: var(--preci-text-disabled);
    }

    .price-input-wrapper {
      display: flex;
      align-items: center;
      background: var(--preci-surface-alt);
      border: 2px solid var(--preci-border);
      border-radius: 12px;
      padding: 0 16px;
      transition: border-color 0.2s;
    }

    .price-input-wrapper:focus-within {
      border-color: var(--preci-primary);
    }

    .price-prefix {
      font-size: 22px;
      font-weight: 700;
      color: var(--preci-primary-dark);
      font-family: var(--preci-font-nums);
      margin-right: 4px;
    }

    .price-input {
      flex: 1;
      height: 56px;
      border: none;
      background: transparent;
      font-size: 32px;
      font-weight: 700;
      color: var(--preci-text-primary);
      font-family: var(--preci-font-nums);
      letter-spacing: -0.02em;
      outline: none;
    }

    .price-input::placeholder {
      color: var(--preci-text-disabled);
      font-weight: 400;
    }

    .location-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      color: var(--preci-text-secondary);
      font-size: 14px;
      font-family: var(--preci-font);
    }

    .location-status ion-spinner {
      width: 20px;
      height: 20px;
    }

    .location-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--preci-warning-bg);
      border-radius: 10px;
      color: var(--preci-accent-darker);
      font-size: 13px;
      font-family: var(--preci-font);
    }

    .location-error ion-icon {
      font-size: 18px;
      color: var(--preci-warning);
      flex-shrink: 0;
    }

    .store-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 200px;
      overflow-y: auto;
    }

    .store-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: var(--preci-surface);
      border: 1.5px solid var(--preci-border);
      border-radius: 10px;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      -webkit-tap-highlight-color: transparent;
    }

    .store-option:active {
      background: var(--preci-surface-alt);
    }

    .store-option--selected {
      border-color: var(--preci-primary);
      background: var(--preci-price-best-bg);
    }

    .store-option__icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: var(--preci-text-tertiary);
      background: var(--preci-surface-alt);
      font-family: var(--preci-font);
      flex-shrink: 0;
    }

    .store-type--supermercado {
      background: rgba(30, 58, 95, 0.1) !important;
      color: #1e3a5f !important;
    }

    .store-type--bodega {
      background: rgba(22, 163, 74, 0.1) !important;
      color: #059669 !important;
    }

    .store-type--mercado {
      background: rgba(217, 119, 6, 0.1) !important;
      color: #d97706 !important;
    }

    .store-type--minimarket {
      background: rgba(124, 58, 237, 0.1) !important;
      color: #7c3aed !important;
    }

    .store-option__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .store-option__name {
      font-size: 14px;
      font-weight: 600;
      color: var(--preci-text-primary);
      font-family: var(--preci-font);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .store-option__meta {
      font-size: 12px;
      color: var(--preci-text-tertiary);
      font-family: var(--preci-font);
    }

    .store-option__check {
      font-size: 22px;
      color: var(--preci-primary);
      flex-shrink: 0;
    }

    .no-stores {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px;
      color: var(--preci-text-tertiary);
      font-size: 14px;
      font-family: var(--preci-font);
    }

    .no-stores ion-icon {
      font-size: 32px;
    }

    .note-input {
      width: 100%;
      padding: 12px;
      border: 1.5px solid var(--preci-border);
      border-radius: 10px;
      background: var(--preci-surface-alt);
      color: var(--preci-text-primary);
      font-size: 14px;
      font-family: var(--preci-font);
      resize: none;
      outline: none;
      transition: border-color 0.2s;
    }

    .note-input:focus {
      border-color: var(--preci-primary);
    }

    .note-input::placeholder {
      color: var(--preci-text-disabled);
    }
  `],
  standalone: false,
})
export class ReportPriceModalComponent implements OnInit {
  @Input() product!: Product;

  price: number | null = null;
  selectedStore: Store | null = null;
  isOnSale = false;
  notes = '';
  isSubmitting = false;

  nearbyStores: Store[] = [];
  isLoadingLocation = true;
  locationError = '';

  private userLat = 0;
  private userLng = 0;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private storesService: StoresService,
    private priceReportsService: PriceReportsService,
  ) {}

  ngOnInit() {
    this.getUserLocation();
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  selectStore(store: Store) {
    this.selectedStore = store;
  }

  canSubmit(): boolean {
    return !!(this.price && this.price > 0 && this.selectedStore);
  }

  async submit() {
    if (!this.canSubmit() || this.isSubmitting) return;

    this.isSubmitting = true;

    const report: CreatePriceReport = {
      productId: this.product._id,
      storeId: this.selectedStore!._id,
      price: this.price!,
      latitude: this.userLat,
      longitude: this.userLng,
      isOnSale: this.isOnSale,
      notes: this.notes.trim() || undefined,
    };

    this.priceReportsService.create(report).subscribe({
      next: async () => {
        this.isSubmitting = false;
        const toast = await this.toastCtrl.create({
          message: 'Precio reportado. Gracias por contribuir!',
          duration: 3000,
          color: 'success',
          position: 'bottom',
          icon: 'checkmark-circle-outline',
        });
        await toast.present();
        this.modalCtrl.dismiss({ submitted: true });
      },
      error: async () => {
        this.isSubmitting = false;
        const toast = await this.toastCtrl.create({
          message: 'No se pudo enviar el reporte. Intenta de nuevo.',
          duration: 3000,
          color: 'danger',
          position: 'bottom',
          icon: 'alert-circle-outline',
        });
        await toast.present();
      },
    });
  }

  private getUserLocation() {
    this.isLoadingLocation = true;
    this.locationError = '';

    if (!navigator.geolocation) {
      this.locationError = 'Tu dispositivo no soporta geolocalizacion.';
      this.isLoadingLocation = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLat = position.coords.latitude;
        this.userLng = position.coords.longitude;
        this.loadNearbyStores();
      },
      () => {
        this.isLoadingLocation = false;
        this.locationError = 'No se pudo obtener tu ubicacion. Habilita el GPS.';
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  private loadNearbyStores() {
    this.storesService
      .getNearby({
        latitude: this.userLat,
        longitude: this.userLng,
        radiusMeters: 3000,
        limit: 10,
      })
      .subscribe({
        next: (stores) => {
          // Filtrar tiendas online
          this.nearbyStores = stores.filter((s) => !s.isOnline);
          this.isLoadingLocation = false;
        },
        error: () => {
          this.isLoadingLocation = false;
          this.locationError = 'Error al buscar tiendas cercanas.';
        },
      });
  }
}
