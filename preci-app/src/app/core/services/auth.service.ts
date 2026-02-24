import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  level: string;
  points: number;
  totalReports: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

const TOKEN_KEY = 'preci_access_token';
const REFRESH_KEY = 'preci_refresh_token';
const USER_KEY = 'preci_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(this.loadUser());
  user$ = this.userSubject.asObservable();

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.userSubject.next(response.user);
  }

  requestOtp(email: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/email/request-otp', { email });
  }

  verifyOtp(email: string, otp: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/email/verify-otp', { email, otp }).pipe(
      tap((response) => this.storeSession(response)),
    );
  }

  getGoogleAuthUrl(): string {
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/google/callback');
    return `${environment.apiUrl}/auth/google?platform=web&redirect_uri=${redirectUri}`;
  }

  loginWithGoogle(): void {
    window.location.href = this.getGoogleAuthUrl();
  }

  handleGoogleCallback(params: {
    access_token?: string;
    refresh_token?: string;
    user?: string;
    is_new_user?: string;
    error?: string;
  }): void {
    if (params.error || !params.access_token || !params.refresh_token || !params.user) {
      return;
    }
    try {
      const user = JSON.parse(decodeURIComponent(params.user)) as User;
      this.storeSession({
        accessToken: params.access_token,
        refreshToken: params.refresh_token,
        user,
      });
    } catch {
      // silently ignore parse errors — google-callback page handles navigation
    }
  }

  getMe(): Observable<User> {
    return this.api.get<User>('/auth/me').pipe(
      tap((user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.userSubject.next(user);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSubject.next(null);
    this.router.navigateByUrl('/tabs/search');
  }

  refreshToken(): Observable<{ accessToken: string }> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    return this.api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).pipe(
      tap((response) => {
        localStorage.setItem(TOKEN_KEY, response.accessToken);
      }),
    );
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
