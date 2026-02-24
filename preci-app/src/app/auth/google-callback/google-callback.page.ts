import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-google-callback',
  templateUrl: 'google-callback.page.html',
  styleUrls: ['google-callback.page.scss'],
  standalone: false,
})
export class GoogleCallbackPage implements OnInit {
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams as {
      access_token?: string;
      refresh_token?: string;
      user?: string;
      is_new_user?: string;
      error?: string;
    };

    if (params.error) {
      this.errorMessage = this.decodeError(params.error);
      setTimeout(() => this.router.navigateByUrl('/auth'), 3000);
      return;
    }

    if (!params.access_token || !params.refresh_token || !params.user) {
      this.errorMessage = 'Respuesta invalida del servidor.';
      setTimeout(() => this.router.navigateByUrl('/auth'), 3000);
      return;
    }

    try {
      this.authService.handleGoogleCallback(params);
      this.router.navigateByUrl('/tabs/search');
    } catch {
      this.errorMessage = 'Error al procesar la autenticacion.';
      setTimeout(() => this.router.navigateByUrl('/auth'), 3000);
    }
  }

  private decodeError(error: string): string {
    const map: Record<string, string> = {
      access_denied: 'Acceso denegado por Google.',
      invalid_state: 'Sesion invalida. Intenta de nuevo.',
      server_error: 'Error del servidor. Intenta mas tarde.',
    };
    return map[error] ?? 'Error al iniciar sesion con Google.';
  }
}
