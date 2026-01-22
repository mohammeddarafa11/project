// src/app/app.config.ts
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { DarkModeService } from '@core/services/darkmode.service';
import { errorInterceptor } from '@core/interceptors/error-interceptor';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor]),
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initDarkModeFactory,
      deps: [DarkModeService, PLATFORM_ID],
      multi: true,
    },
  ],
};

export function initDarkModeFactory(
  darkModeService: DarkModeService,
  platformId: Object,
) {
  return () => {
    if (isPlatformBrowser(platformId)) {
      darkModeService.initTheme();
    }
  };
}
