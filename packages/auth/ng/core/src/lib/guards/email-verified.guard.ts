import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

/**
 * Allows route activation only when the current user's email has been verified.
 *
 * @returns `true` for verified users, or a `UrlTree` pointing to `/auth/verification`.
 *
 * @example
 * ```ts
 * {
 *   path: 'billing',
 *   canActivate: [authGuard, emailVerifiedGuard],
 *   loadComponent: () => import('./billing').then((m) => m.BillingPage),
 * }
 * ```
 */
export const emailVerifiedGuard: CanActivateFn = () => {
  const state = inject(AuthStateService);
  const router = inject(Router);

  if (state.isEmailVerified()) return true;
  return router.createUrlTree(['/auth/verification']);
};
