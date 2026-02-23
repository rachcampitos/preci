import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'preci-theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private currentTheme: Theme = 'system';

  /** Emits true/false whenever effective dark mode changes */
  readonly darkModeChange$ = new Subject<boolean>();

  private systemQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.applyTheme(this.getSavedTheme());

    // Listen for system preference changes
    this.systemQuery.addEventListener('change', () => {
      if (this.currentTheme === 'system') {
        this.applyTheme('system');
      }
    });
  }

  getTheme(): Theme {
    return this.currentTheme;
  }

  isDark(): boolean {
    if (this.currentTheme === 'dark') return true;
    if (this.currentTheme === 'light') return false;
    return this.systemQuery.matches;
  }

  setTheme(theme: Theme): void {
    this.applyTheme(theme);
  }

  private getSavedTheme(): Theme {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'system';
  }

  private applyTheme(theme: Theme): void {
    this.currentTheme = theme;
    const root = document.documentElement;
    const body = document.body;

    if (theme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
      body.classList.remove('dark', 'ion-palette-dark');
      localStorage.setItem(STORAGE_KEY, 'light');
    } else if (theme === 'dark') {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
      body.classList.add('dark', 'ion-palette-dark');
      localStorage.setItem(STORAGE_KEY, 'dark');
    } else {
      // system: remove manual overrides and let media query decide
      root.classList.remove('theme-light', 'theme-dark');
      // For Ionic compat: check actual system preference to sync body classes
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        body.classList.add('dark', 'ion-palette-dark');
      } else {
        body.classList.remove('dark', 'ion-palette-dark');
      }
      localStorage.removeItem(STORAGE_KEY);
    }

    this.darkModeChange$.next(this.isDark());
  }
}
