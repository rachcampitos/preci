import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export interface ProductCardData {
  _id?: string;
  id?: string;
  name: string;
  brand?: string;
  unit?: string;       // ej: "1kg", "500ml", "6 unidades"
  unitSize?: number;
  imageUrl?: string;
  barcode?: string;
}

export interface BestPriceData {
  price: number;
  storeName: string;
  district?: string;
  reportedAt?: Date;
  confirmations?: number;
  isOnline?: boolean;  // true = precio scrapeado, false = crowdsourced
}

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, IonicModule, DecimalPipe],
})
export class ProductCardComponent {
  @Input() product!: ProductCardData;

  // Precio mas bajo encontrado (el que se muestra)
  @Input() bestPrice?: BestPriceData;

  // Precio de referencia (el mas alto, para calcular el ahorro)
  @Input() referencePrice?: number;

  // Variante compacta para listas densas
  @Input() compact = false;

  get savings(): number | null {
    if (!this.bestPrice || !this.referencePrice) return null;
    const diff = this.referencePrice - this.bestPrice.price;
    return diff > 0.01 ? diff : null;
  }
}
