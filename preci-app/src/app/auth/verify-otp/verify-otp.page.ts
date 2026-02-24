import { Component, OnDestroy, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
  templateUrl: 'verify-otp.page.html',
  styleUrls: ['verify-otp.page.scss'],
  standalone: false,
})
export class VerifyOtpPage implements OnInit, OnDestroy {
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  email = '';
  digits: string[] = ['', '', '', '', '', ''];
  loading = false;
  resendLoading = false;
  errorMessage = '';
  countdown = 0;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    if (!this.email) {
      this.router.navigateByUrl('/auth');
      return;
    }
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  get otp(): string {
    return this.digits.join('');
  }

  get maskedEmail(): string {
    const [local, domain] = this.email.split('@');
    if (!domain) return this.email;
    const visible = local.slice(0, 2);
    const masked = '*'.repeat(Math.max(0, local.length - 2));
    return `${visible}${masked}@${domain}`;
  }

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);
    this.digits[index] = value;
    this.errorMessage = '';

    if (value && index < 5) {
      const next = this.digitInputs.toArray()[index + 1];
      next?.nativeElement.focus();
    }

    if (this.otp.length === 6 && !this.digits.includes('')) {
      this.verify();
    }
  }

  onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      if (!this.digits[index] && index > 0) {
        this.digits[index - 1] = '';
        const prev = this.digitInputs.toArray()[index - 1];
        prev?.nativeElement.focus();
      } else {
        this.digits[index] = '';
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.digitInputs.toArray()[index - 1]?.nativeElement.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      this.digitInputs.toArray()[index + 1]?.nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    digits.forEach((d, i) => {
      if (i < 6) this.digits[i] = d;
    });
    const lastFilled = Math.min(digits.length, 5);
    this.digitInputs.toArray()[lastFilled]?.nativeElement.focus();

    if (digits.length === 6) {
      this.verify();
    }
  }

  verify(): void {
    if (this.otp.length !== 6 || this.loading) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.verifyOtp(this.email, this.otp).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/tabs/search');
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message;
        if (typeof msg === 'string') {
          this.errorMessage = msg;
        } else {
          this.errorMessage = 'Codigo incorrecto o expirado.';
        }
        this.digits = ['', '', '', '', '', ''];
        setTimeout(() => {
          this.digitInputs.toArray()[0]?.nativeElement.focus();
        }, 50);
      },
    });
  }

  resend(): void {
    if (this.countdown > 0 || this.resendLoading) return;

    this.resendLoading = true;
    this.errorMessage = '';

    this.authService.requestOtp(this.email).subscribe({
      next: async () => {
        this.resendLoading = false;
        this.startCountdown();
        const toast = await this.toastCtrl.create({
          message: 'Codigo reenviado',
          duration: 2500,
          position: 'bottom',
          color: 'success',
        });
        await toast.present();
      },
      error: async (err) => {
        this.resendLoading = false;
        const message = err?.error?.message || 'Error al reenviar el codigo.';
        const toast = await this.toastCtrl.create({
          message,
          duration: 3000,
          position: 'bottom',
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/auth');
  }

  private startCountdown(): void {
    this.clearCountdown();
    this.countdown = 60;
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.clearCountdown();
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}
