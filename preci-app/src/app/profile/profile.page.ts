import { Component } from '@angular/core';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  standalone: false,
})
export class ProfilePage {
  // TODO: Cargar datos del usuario autenticado
  user = {
    displayName: 'Usuario',
    level: 'nuevo',
    points: 0,
    totalReports: 0,
  };

  constructor(private themeService: ThemeService) {}

  get theme(): string {
    return this.themeService.getTheme();
  }

  setTheme(theme: string): void {
    this.themeService.setTheme(theme as 'light' | 'dark' | 'system');
  }

  get segIndicatorTransform(): string {
    switch (this.theme) {
      case 'light':  return 'translateX(0px)';
      case 'system': return 'translateX(38px)';
      case 'dark':   return 'translateX(76px)';
      default:       return 'translateX(38px)';
    }
  }

  login() {
    // TODO: Navegar a login
    console.log('Login');
  }
}
