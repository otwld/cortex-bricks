import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_CONFIG } from '../tokens/auth-config.token';
import { AuthStateService } from '../services/auth-state.service';

/**
 * Allows route activation for authenticated users and redirects guests to the configured login route.
 *
 * @returns `true` for authenticated sessions, or a `UrlTree` pointing to `afterLogoutRoute` or `/auth/login`.
 *
 * @example
 * ```ts
 * {
 *   path: 'account',
 *   canActivate: [authGuard],
 *   loadComponent: () => import('./account').then((m) => m.AccountPage),
 * }
 * ```
 */
export const authGuard: CanActivateFn = () => {
  const state = inject(AuthStateService);
  const router = inject(Router);
  const config = inject(AUTH_CONFIG);

  if (state.isAuthenticated()) return true;
  return router.createUrlTree([config.afterLogoutRoute ?? '/auth/login']);
};
