import { isPlatformBrowser } from '@angular/common';
import {
  ApplicationConfig,
  PLATFORM_ID,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { AuthService, provideAuth } from '@otwld/ng-auth/core';
import { lastValueFrom } from 'rxjs';
import { provideDarkMode } from '@otwld/ng-cdk';
import { provideStorage } from '@otwld/ng-storage';
import { provideAi } from '@otwld/ng-ai';
import { provideUsers } from '@otwld/ng-users/core';

/**
 * Browser application configuration for the Cortex Bricks frontend shell.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
    provideZonelessChangeDetection(),
    provideAuth({
      apiUrl: '/api/auth',
      devLoginEnabled: isDevMode(),
    }),
    provideUsers({ apiUrl: '/api/users' }),
    provideDarkMode({ autoSync: true }),
    provideStorage({
      tusEndpoint: '/api/storage/tus',
      signedUrlEndpoint: '/api/storage/signed-url',
      defaultExpiresIn: 3600,
      chunkSize: 5 * 1024 * 1024,
    }),
    provideAi({
      apiBaseUrl: '/api/ai',
    }),
    provideHttpClient(withFetch()),
    provideAppInitializer(() => {
      if (!isPlatformBrowser(inject(PLATFORM_ID))) {
        return Promise.resolve();
      }

      const authService = inject(AuthService);
      return lastValueFrom(authService.getMe()).catch(() => undefined);
    }),
  ],
};
