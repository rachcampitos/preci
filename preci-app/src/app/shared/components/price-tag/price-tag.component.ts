import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export type PriceTagVariant = 'default' | 'best' | 'worst' | 'online';
export type PriceTagSize = 'normal' | 'large';

@Component({
  selector: 'app-price-tag',
  templateUrl: './price-tag.component.html',
  styleUrls: ['./price-tag.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, IonicModule, DecimalPipe, DatePipe],
})
export class PriceTagComponent {
  // Precio a mostrar
  @Input() price!: number;

  // Estilo visual: default=verde, best=naranja, worst=rojo, online=azul
  @Input() variant: PriceTagVariant = 'default';

  // Tamano: normal=compacto (en listas), large=grande (resultado de scan)
  @Input() size: PriceTagSize = 'normal';

  // Datos de tienda (solo se muestran en size=large)
  @Input() storeName?: string;
  @Input() district?: string;
  @Input() reportedAt?: Date;
  @Input() confirmations?: number;
}
