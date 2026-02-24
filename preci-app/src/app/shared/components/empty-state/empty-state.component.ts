import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

// Configuraciones predefinidas por contexto
export type EmptyStatePreset =
  | 'search'        // Sin resultados de busqueda
  | 'list'          // Lista de compras vacia
  | 'map'           // Sin tiendas en la zona
  | 'profile'       // Usuario no autenticado
  | 'history'       // Sin historial de escaneos
  | 'alerts';       // Sin alertas configuradas

interface EmptyStateConfig {
  icon: string;
  iconColor: string;
  iconBackground: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaIcon?: string;
  secondaryCtaLabel?: string;
}

const PRESETS: Record<EmptyStatePreset, EmptyStateConfig> = {
  search: {
    icon: 'search-outline',
    iconColor: '#94a3b8',
    iconBackground: '#f1f5f9',
    title: 'Sin resultados',
    description: 'Prueba con otro nombre o escanea el codigo de barras del producto',
    ctaLabel: 'Escanear producto',
    ctaIcon: 'scan-outline',
  },
  list: {
    icon: 'list-outline',
    iconColor: '#34d399',
    iconBackground: '#ecfdf5',
    title: 'Tu lista esta vacia',
    description: 'Agrega productos para comparar precios antes de ir al super',
    ctaLabel: 'Agregar producto',
    ctaIcon: 'add-outline',
  },
  map: {
    icon: 'map-outline',
    iconColor: '#94a3b8',
    iconBackground: '#f1f5f9',
    title: 'Sin tiendas en esta zona',
    description: 'Mueve el mapa para explorar otros distritos de Lima',
  },
  profile: {
    icon: 'person-outline',
    iconColor: '#34d399',
    iconBackground: '#ecfdf5',
    title: 'Crea tu cuenta',
    description: 'Gana puntos reportando precios y sube de nivel',
    ctaLabel: 'Registrarse',
    secondaryCtaLabel: 'Ya tengo cuenta',
  },
  history: {
    icon: 'time-outline',
    iconColor: '#94a3b8',
    iconBackground: '#f1f5f9',
    title: 'Sin escaneos aun',
    description: 'Escanea productos en el super para ver su historial de precios',
    ctaLabel: 'Empezar a escanear',
    ctaIcon: 'scan-outline',
  },
  alerts: {
    icon: 'notifications-outline',
    iconColor: '#f97316',
    iconBackground: '#fff7ed',
    title: 'Sin alertas configuradas',
    description: 'Configura alertas para recibir notificaciones cuando un precio baje',
    ctaLabel: 'Crear alerta',
    ctaIcon: 'add-outline',
  },
};

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class EmptyStateComponent {
  // Usar preset O pasar props manualmente
  @Input() set preset(value: EmptyStatePreset) {
    const config = PRESETS[value];
    if (config) {
      this.icon = config.icon;
      this.iconColor = config.iconColor;
      this.iconBackground = config.iconBackground;
      this.title = config.title;
      this.description = config.description;
      if (config.ctaLabel)          this.ctaLabel = config.ctaLabel;
      if (config.ctaIcon)           this.ctaIcon = config.ctaIcon;
      if (config.secondaryCtaLabel) this.secondaryCtaLabel = config.secondaryCtaLabel;
    }
  }

  @Input() icon = 'alert-circle-outline';
  @Input() iconColor?: string;
  @Input() iconBackground?: string;
  @Input() title = '';
  @Input() description?: string;
  @Input() ctaLabel?: string;
  @Input() ctaIcon?: string;
  @Input() secondaryCtaLabel?: string;

  @Output() ctaClicked = new EventEmitter<void>();
  @Output() secondaryCtaClicked = new EventEmitter<void>();
}
