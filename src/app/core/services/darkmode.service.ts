import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, Injectable, OnDestroy, PLATFORM_ID, computed, inject, signal } from '@angular/core';

export enum EThemeModes {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}
export type ThemeOptions = EThemeModes.LIGHT | EThemeModes.DARK | EThemeModes.SYSTEM;

@Injectable({ providedIn: 'root' })
export class DarkModeService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private themeSignal = signal<ThemeOptions>(EThemeModes.SYSTEM);
  private darkModeQuery?: MediaQueryList;
  private handleThemeChange = (event: MediaQueryListEvent) => this.updateMode(event.matches);

  readonly theme = computed(() => this.themeSignal());

  constructor() {
    // Initialize immediately during construction (SSR-safe)
    if (this.isBrowser) {
      this.initTheme();
    }
  }

  ngOnDestroy(): void {
    this.handleSystemChanges(false);
  }

  initTheme(): void {
    if (!this.isBrowser) return;

    const stored = this.getStoredTheme();
    this.applyTheme(stored ?? EThemeModes.SYSTEM);
  }

  toggleTheme(): void {
    if (!this.isBrowser) return;

    const current = this.getCurrentTheme();
    if (current === EThemeModes.SYSTEM) return;

    this.applyTheme(current === EThemeModes.DARK ? EThemeModes.LIGHT : EThemeModes.DARK);
  }

  private applyTheme(theme: ThemeOptions): void {
    if (!this.isBrowser) return;

    localStorage.setItem('theme', theme); // Use setItem (SSR-safe after isBrowser)
    this.themeSignal.set(theme);
    this.handleSystemChanges(false);

    this.darkModeQuery ??= this.getDarkModeQuery();
    this.updateMode(this.isDarkMode());

    if (theme === EThemeModes.SYSTEM) {
      this.handleSystemChanges(true);
    }
  }

  // SSR-SAFE: No localStorage access without browser check
  private getStoredTheme(): ThemeOptions | undefined {
    if (!this.isBrowser) return undefined;
    try {
      const value = localStorage.getItem('theme');
      return (Object.values(EThemeModes) as ThemeOptions[]).includes(value as any)
        ? value as ThemeOptions : undefined;
    } catch {
      return undefined;
    }
  }

  // SSR-SAFE: Defensive localStorage access
  private isDarkMode(): boolean {
    if (!this.isBrowser) return false;

    try {
      const stored = localStorage.getItem('theme');
      if (stored === EThemeModes.DARK) return true;
      if (stored === EThemeModes.SYSTEM) {
        return this.darkModeQuery?.matches ?? false;
      }
      return false;
    } catch {
      return this.darkModeQuery?.matches ?? false;
    }
  }

  // Rest of methods unchanged...
  getCurrentTheme(): ThemeOptions { return this.themeSignal(); }
  getThemeMode(isDarkMode: boolean): EThemeModes.LIGHT | EThemeModes.DARK {
    return isDarkMode ? EThemeModes.DARK : EThemeModes.LIGHT;
  }

  private updateMode(isDarkMode: boolean): void {
    const themeMode = this.getThemeMode(isDarkMode);
    const html = this.document.documentElement;
    html.classList.toggle('dark', isDarkMode);
    html.setAttribute('data-theme', themeMode);
    html.style.colorScheme = themeMode;
  }

  private getDarkModeQuery(): MediaQueryList | undefined {
    return this.isBrowser ?
      this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)') : undefined;
  }

  private handleSystemChanges(addListener: boolean): void {
    const query = this.darkModeQuery;
    if (!query || !this.isBrowser) return;

    if (addListener) {
      query.addEventListener('change', this.handleThemeChange);
    } else {
      query.removeEventListener('change', this.handleThemeChange);
    }
  }
}

