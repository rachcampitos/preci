import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService, User } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {
  user: User | null = null;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router,
    private alertCtrl: AlertController,
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      this.user = user;
    });
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

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

  login(): void {
    this.router.navigateByUrl('/auth');
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  async logout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesion',
      message: 'Seguro que deseas cerrar sesion?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar sesion',
          role: 'destructive',
          handler: () => this.authService.logout(),
        },
      ],
    });
    await alert.present();
  }
}
