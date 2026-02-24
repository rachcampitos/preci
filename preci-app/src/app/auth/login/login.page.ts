import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  loadingOtp = false;
  loadingGoogle = false;
  emailFocused = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
  ) {}

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  async sendOtp(): Promise<void> {
    if (!this.isValidEmail(this.email)) {
      await this.showToast('Ingresa un correo valido');
      return;
    }

    this.loadingOtp = true;
    this.authService.requestOtp(this.email.trim().toLowerCase()).subscribe({
      next: async () => {
        this.loadingOtp = false;
        this.router.navigate(['/auth/verify-otp'], {
          queryParams: { email: this.email.trim().toLowerCase() },
        });
      },
      error: async (err) => {
        this.loadingOtp = false;
        const message = err?.error?.message || 'Error al enviar el codigo. Intenta de nuevo.';
        await this.showToast(message);
      },
    });
  }

  loginWithGoogle(): void {
    this.loadingGoogle = true;
    this.authService.loginWithGoogle();
  }

  continueWithoutAccount(): void {
    this.router.navigateByUrl('/tabs/search');
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
    });
    await toast.present();
  }
}
