import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService, User } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';

interface LevelInfo {
  label: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
  color: string;
}

const LEVELS: LevelInfo[] = [
  { label: 'Nuevo', icon: 'leaf-outline', minPoints: 0, maxPoints: 100, color: 'nuevo' },
  { label: 'Colaborador', icon: 'flame-outline', minPoints: 100, maxPoints: 500, color: 'colaborador' },
  { label: 'Experto', icon: 'star-outline', minPoints: 500, maxPoints: 2000, color: 'experto' },
  { label: 'Heroe', icon: 'diamond-outline', minPoints: 2000, maxPoints: Infinity, color: 'heroe' },
];

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

  get currentLevel(): LevelInfo {
    if (!this.user) return LEVELS[0];
    return LEVELS.find((l) => l.color === this.user!.level) || LEVELS[0];
  }

  get nextLevel(): LevelInfo | null {
    const idx = LEVELS.indexOf(this.currentLevel);
    return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  }

  get levelProgress(): number {
    if (!this.user) return 0;
    const current = this.currentLevel;
    if (current.maxPoints === Infinity) return 100;
    const range = current.maxPoints - current.minPoints;
    const progress = this.user.points - current.minPoints;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  }

  get pointsToNextLevel(): number {
    if (!this.user || !this.nextLevel) return 0;
    return Math.max(0, this.currentLevel.maxPoints - this.user.points);
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
