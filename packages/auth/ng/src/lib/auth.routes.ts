import { Routes } from '@angular/router';
import { guestGuard, authGuard } from '@otwld/ng-auth/core';

/**
 * Defines the standalone route tree exposed by the Angular auth package.
 *
 * @example
 * ```ts
 * provideRouter([
 *   {
 *     path: 'auth',
 *     children: authRoutes,
 *   },
 * ]);
 * ```
 */
export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.LoginPage),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then((m) => m.RegisterPage),
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'new-password',
    loadComponent: () => import('./new-password/new-password').then((m) => m.NewPasswordPage),
  },
  {
    path: 'verification',
    loadComponent: () => import('./verification/verification').then((m) => m.VerificationPage),
    canActivate: [authGuard],
  },
  {
    path: 'lockscreen',
    loadComponent: () => import('./lock-screen/lock-screen').then((m) => m.LockScreenPage),
  },
  {
    path: 'access',
    loadComponent: () => import('./access-denied/access-denied').then((m) => m.AccessDeniedPage),
  },
  {
    path: 'error',
    loadComponent: () => import('./error/error').then((m) => m.ErrorPage),
  },
];
