import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AbilityService } from './casl/ability.service';
import { CanPipe } from './casl/can.pipe';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';
import { AuthStateService } from './services/auth-state.service';
import { AUTH_CONFIG, AuthConfig } from './tokens/auth-config.token';

/**
 * Registers the Angular auth package providers, HTTP interceptor, and root auth services.
 *
 * @param config - Auth package configuration, including the backend API base URL and optional redirect routes.
 * @returns Environment providers that can be passed to Angular application bootstrap configuration.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideAuth({
 *       apiUrl: '/api/auth',
 *       afterLoginRoute: '/dashboard',
 *       afterLogoutRoute: '/auth/login',
 *     }),
 *   ],
 * });
 * ```
 */
export function provideAuth(config: AuthConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AUTH_CONFIG, useValue: config },
    provideHttpClient(withInterceptors([authInterceptor])),
    AuthService,
    AuthStateService,
    AbilityService,
    CanPipe,
  ]);
}
