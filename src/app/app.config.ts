import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { DarkModeService } from '@core/services/darkmode.service'; // Add this import
import { errorInterceptor } from '@core/interceptors/error-interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor])),

    // Fixed APP_INITIALIZER
    {
      provide: APP_INITIALIZER,
      useFactory: initDarkModeFactory,
      deps: [DarkModeService, PLATFORM_ID],
      multi: true,
    },
  ],
};

// Move factory to top-level function (SSR-safe)
export function initDarkModeFactory(
  darkModeService: DarkModeService,
  platformId: Object
) {
  return () => {
    if (isPlatformBrowser(platformId)) {
      darkModeService.initTheme();
    }
  };
}
