import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AUTH_CONFIG } from '../tokens/auth-config.token';
import { AuthStateService } from '../services/auth-state.service';

/**
 * Allows route activation for guests and redirects authenticated users away from guest-only pages.
 *
 * @returns `true` for unauthenticated sessions, or a `UrlTree` pointing to `afterLoginRoute` or `/dashboard`.
 *
 * @example
 * ```ts
 * {
 *   path: 'login',
 *   canActivate: [guestGuard],
 *   loadComponent: () => import('./login').then((m) => m.LoginPage),
 * }
 * ```
 */
export const guestGuard: CanActivateFn = () => {
  const state = inject(AuthStateService);
  const router = inject(Router);
  const config = inject(AUTH_CONFIG);

  if (!state.isAuthenticated()) return true;
  return router.createUrlTree([config.afterLoginRoute ?? '/dashboard']);
};
