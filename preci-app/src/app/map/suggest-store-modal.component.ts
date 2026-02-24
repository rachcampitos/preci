import { Component } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { StoresService } from '../core/services/stores.service';

interface StoreTypeOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-suggest-store-modal',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>Agregar tienda</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()" aria-label="Cerrar">
            <ion-icon name="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- Location status -->
      <div class="location-banner" *ngIf="userLat && userLng">
        <ion-icon name="location" color="primary"></ion-icon>
        <span>Se usara tu ubicacion actual</span>
      </div>

      <!-- Store name -->
      <div class="field">
        <label class="field-label">Nombre de la tienda</label>
        <input
          type="text"
          [(ngModel)]="storeName"
          placeholder="Ej: Bodega Don Jose"
          class="field-input"
          maxlength="100"
        />
      </div>

      <!-- Store type -->
      <div class="field">
        <label class="field-label">Tipo</label>
        <div class="type-grid">
          <button
            *ngFor="let opt of storeTypes"
            class="type-option"
            [class.type-option--selected]="selectedType === opt.value"
            (click)="selectedType = opt.value"
          >
            <ion-icon [name]="opt.icon"></ion-icon>
            <span>{{ opt.label }}</span>
          </button>
        </div>
      </div>

      <!-- Address -->
      <div class="field">
        <label class="field-label">Direccion <span class="optional">(opcional)</span></label>
        <input
          type="text"
          [(ngModel)]="address"
          placeholder="Ej: Av. Javier Prado 1234"
          class="field-input"
          maxlength="200"
        />
      </div>

      <!-- District -->
      <div class="field">
        <label class="field-label">Distrito <span class="optional">(opcional)</span></label>
        <input
          type="text"
          [(ngModel)]="district"
          placeholder="Ej: La Molina"
          class="field-input"
          maxlength="50"
        />
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
            <ion-icon *ngIf="!isSubmitting" name="add-circle-outline" slot="start"></ion-icon>
            {{ isSubmitting ? 'Guardando...' : 'Agregar tienda' }}
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

    .location-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: var(--preci-price-best-bg);
      border: 1px solid var(--preci-primary);
      border-radius: 10px;
      margin-bottom: 20px;
      font-size: 13px;
      font-family: var(--preci-font);
      color: var(--preci-text-secondary);
    }

    .location-banner ion-icon {
      font-size: 18px;
      flex-shrink: 0;
    }

    .field {
      margin-bottom: 20px;
    }

    .field-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--preci-text-secondary);
      font-family: var(--preci-font);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .optional {
      font-weight: 400;
      text-transform: none;
      letter-spacing: 0;
      color: var(--preci-text-disabled);
    }

    .field-input {
      width: 100%;
      height: 48px;
      padding: 0 14px;
      border: 1.5px solid var(--preci-border);
      border-radius: 10px;
      background: var(--preci-surface-alt);
      color: var(--preci-text-primary);
      font-size: 15px;
      font-family: var(--preci-font);
      outline: none;
      transition: border-color 0.2s;
    }

    .field-input:focus {
      border-color: var(--preci-primary);
    }

    .field-input::placeholder {
      color: var(--preci-text-disabled);
    }

    .type-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .type-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px 8px;
      border: 1.5px solid var(--preci-border);
      border-radius: 10px;
      background: var(--preci-surface);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      -webkit-tap-highlight-color: transparent;
    }

    .type-option:active {
      background: var(--preci-surface-alt);
    }

    .type-option--selected {
      border-color: var(--preci-primary);
      background: var(--preci-price-best-bg);
    }

    .type-option ion-icon {
      font-size: 22px;
      color: var(--preci-text-secondary);
    }

    .type-option--selected ion-icon {
      color: var(--preci-primary);
    }

    .type-option span {
      font-size: 12px;
      font-weight: 600;
      font-family: var(--preci-font);
      color: var(--preci-text-secondary);
    }

    .type-option--selected span {
      color: var(--preci-primary);
    }
  `],
  standalone: false,
})
export class SuggestStoreModalComponent {
  storeName = '';
  selectedType = '';
  address = '';
  district = '';
  isSubmitting = false;

  userLat = 0;
  userLng = 0;

  storeTypes: StoreTypeOption[] = [
    { value: 'bodega', label: 'Bodega', icon: 'home-outline' },
    { value: 'mercado', label: 'Mercado', icon: 'storefront-outline' },
    { value: 'minimarket', label: 'Minimarket', icon: 'basket-outline' },
    { value: 'supermercado', label: 'Super', icon: 'cart-outline' },
    { value: 'farmacia', label: 'Farmacia', icon: 'medkit-outline' },
    { value: 'mayorista', label: 'Mayorista', icon: 'cube-outline' },
  ];

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private storesService: StoresService,
  ) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  canSubmit(): boolean {
    return !!(
      this.storeName.trim().length >= 2 &&
      this.selectedType &&
      this.userLat &&
      this.userLng
    );
  }

  async submit() {
    if (!this.canSubmit() || this.isSubmitting) return;

    this.isSubmitting = true;

    this.storesService
      .suggest({
        name: this.storeName.trim(),
        type: this.selectedType,
        latitude: this.userLat,
        longitude: this.userLng,
        address: this.address.trim() || undefined,
        district: this.district.trim() || undefined,
      })
      .subscribe({
        next: async (store) => {
          this.isSubmitting = false;
          const toast = await this.toastCtrl.create({
            message: 'Tienda agregada. Gracias!',
            duration: 3000,
            color: 'success',
            position: 'bottom',
            icon: 'checkmark-circle-outline',
          });
          await toast.present();
          this.modalCtrl.dismiss({ store });
        },
        error: async () => {
          this.isSubmitting = false;
          const toast = await this.toastCtrl.create({
            message: 'No se pudo agregar la tienda. Intenta de nuevo.',
            duration: 3000,
            color: 'danger',
            position: 'bottom',
            icon: 'alert-circle-outline',
          });
          await toast.present();
        },
      });
  }
}
