import { InjectionToken, Type } from '@angular/core';

/**
 * Runtime configuration for the Angular auth package.
 *
 * @example
 * ```ts
 * const config: AuthConfig = {
 *   apiUrl: '/api/auth',
 *   afterLoginRoute: '/dashboard',
 *   afterLogoutRoute: '/auth/login',
 * };
 * ```
 */
export interface AuthConfig {
  /**
   * Base URL for backend auth endpoints, without a trailing endpoint segment.
   */
  apiUrl: string;

  /**
   * Optional route navigated to after successful login, registration verification, or unlock.
   */
  afterLoginRoute?: string;

  /**
   * Optional route navigated to after logout or an expired refresh session.
   */
  afterLogoutRoute?: string;

  /**
   * Optional custom Angular component type for host applications that replace the default login page.
   */
  loginComponent?: Type<unknown>;

  /**
   * Optional custom Angular component type for host applications that replace the default registration page.
   */
  registerComponent?: Type<unknown>;

  /**
   * Optional route for authorization failures.
   */
  unauthorizedRoute?: string;

  /**
   * Shows the development login action on the default login page.
   */
  devLoginEnabled?: boolean;
}

/**
 * Injection token used to provide `AuthConfig` to auth services, guards, and interceptors.
 *
 * @example
 * ```ts
 * providers: [{ provide: AUTH_CONFIG, useValue: { apiUrl: '/api/auth' } }]
 * ```
 */
export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');
