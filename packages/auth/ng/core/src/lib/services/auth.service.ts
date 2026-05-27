import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, tap, throwError } from 'rxjs';
import { AUTH_CONFIG } from '../tokens/auth-config.token';
import { AuthStateService, AuthUser } from './auth-state.service';

/**
 * Registration payload submitted to the auth API.
 *
 * @example
 * ```ts
 * const dto: RegisterDto = {
 *   email: 'user@example.com',
 *   password: 'correct-horse-battery-staple',
 *   firstName: 'Ada',
 *   lastName: 'Lovelace',
 * };
 * ```
 */
export interface RegisterDto {
  /**
   * Email address for the new account.
   */
  email: string;

  /**
   * Plain-text password submitted to the backend registration endpoint.
   */
  password: string;

  /**
   * Optional given name for the new account profile.
   */
  firstName?: string;

  /**
   * Optional family name for the new account profile.
   */
  lastName?: string;
}

/**
 * Client-side auth API facade for credential, provider, session, and verification flows.
 *
 * @example
 * ```ts
 * authService.login('user@example.com', 'password').subscribe();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * Angular HTTP client used for backend auth requests.
   */
  private readonly http = inject(HttpClient);

  /**
   * Auth package configuration containing API and redirect settings.
   */
  private readonly config = inject(AUTH_CONFIG);

  /**
   * Client-side auth state updated after session-related responses.
   */
  private readonly state = inject(AuthStateService);

  /**
   * Angular router used for logout navigation.
   */
  private readonly router = inject(Router);

  /**
   * Base URL for backend auth endpoints.
   *
   * @returns The configured auth API URL.
   *
   * @example
   * ```ts
   * // When apiUrl is '/api/auth', login posts to '/api/auth/login'.
   * ```
   */
  private get base(): string {
    return this.config.apiUrl;
  }

  /**
   * Authenticates a user with email and password credentials.
   *
   * @param email - Email address submitted by the user.
   * @param password - Password submitted by the user.
   * @returns Observable that emits the authenticated user and stores it in `AuthStateService`.
   *
   * @example
   * ```ts
   * authService.login('user@example.com', 'password').subscribe();
   * ```
   */
  login(email: string, password: string) {
    return this.http.post<AuthUser>(`${this.base}/login`, { email, password }, { withCredentials: true }).pipe(tap((user) => this.state.setUser(user)));
  }

  /**
   * Authenticates against the backend development-only login endpoint.
   *
   * @param email - Configured development account email address.
   * @param password - Configured development account password.
   * @returns Observable that emits the authenticated development user and stores it in auth state.
   *
   * @example
   * ```ts
   * authService.devLogin('dev@example.com', 'local-only').subscribe();
   * ```
   */
  devLogin(email: string, password: string) {
    return this.http.post<AuthUser>(`${this.base}/dev-login`, { email, password }, { withCredentials: true }).pipe(tap((user) => this.state.setUser(user)));
  }

  /**
   * Creates a new user account.
   *
   * @param dto - Registration payload containing email, password, and optional profile fields.
   * @returns Observable that emits the created user returned by the backend.
   *
   * @example
   * ```ts
   * authService.register({ email: 'user@example.com', password: 'password123' }).subscribe();
   * ```
   */
  register(dto: RegisterDto) {
    return this.http.post<AuthUser>(`${this.base}/register`, dto, { withCredentials: true });
  }

  /**
   * Logs out the current user, clears auth state, and navigates to the configured logout route.
   *
   * @returns Observable that completes after the backend logout endpoint responds.
   *
   * @example
   * ```ts
   * authService.logout().subscribe();
   * ```
   */
  logout() {
    return this.http.post<void>(`${this.base}/logout`, {}, { withCredentials: true }).pipe(finalize(() => this.clearSessionAndRedirect()));
  }

  /**
   * Refreshes the current session using the backend refresh endpoint.
   *
   * @returns Observable that emits the refreshed authenticated user.
   *
   * @example
   * ```ts
   * authService.refresh().subscribe();
   * ```
   */
  refresh() {
    return this.http.post<AuthUser>(`${this.base}/refresh`, {}, { withCredentials: true });
  }

  /**
   * Loads the current authenticated user from the backend.
   *
   * @returns Observable that emits the current user and updates auth state/loading state.
   *
   * @example
   * ```ts
   * authService.getMe().subscribe();
   * ```
   */
  getMe() {
    return this.http.get<AuthUser>(`${this.base}/me`, { withCredentials: true }).pipe(
      tap((user) => {
        this.state.setUser(user);
      }),
      catchError((err) => {
        if (err?.status === 401) {
          this.state.clearUser();
        }

        return throwError(() => err);
      }),
      finalize(() => this.state.setLoading(false)),
    );
  }

  private clearSessionAndRedirect(): void {
    this.state.clearUser();
    void this.router.navigateByUrl(this.config.afterLogoutRoute ?? '/auth/login');
  }

  /**
   * Redirects the browser to the Google OAuth entrypoint.
   *
   * @returns Nothing.
   *
   * @example
   * ```ts
   * authService.loginWithGoogle();
   * ```
   */
  loginWithGoogle(): void {
    window.location.href = `${this.base}/google`;
  }

  /**
   * Redirects the browser to the GitHub OAuth entrypoint.
   *
   * @returns Nothing.
   *
   * @example
   * ```ts
   * authService.loginWithGithub();
   * ```
   */
  loginWithGithub(): void {
    window.location.href = `${this.base}/github`;
  }

  /**
   * Requests a password reset email for an account.
   *
   * @param email - Email address that should receive the password reset instructions.
   * @returns Observable that completes when the backend accepts the reset request.
   *
   * @example
   * ```ts
   * authService.forgotPassword('user@example.com').subscribe();
   * ```
   */
  forgotPassword(email: string) {
    return this.http.post<void>(`${this.base}/forgot-password`, { email }, { withCredentials: true });
  }

  /**
   * Sets a replacement password using a reset token.
   *
   * @param token - Password reset token supplied by the backend reset email.
   * @param password - Replacement password to store for the account.
   * @returns Observable that completes when the backend accepts the new password.
   *
   * @example
   * ```ts
   * authService.resetPassword(token, 'new-password').subscribe();
   * ```
   */
  resetPassword(token: string, password: string) {
    return this.http.post<void>(`${this.base}/reset-password`, { token, password }, { withCredentials: true });
  }

  /**
   * Verifies the current user's email address with a one-time password.
   *
   * @param otp - One-time verification code entered by the user.
   * @returns Observable that completes when the backend verifies the email address.
   *
   * @example
   * ```ts
   * authService.verifyEmail('123456').subscribe();
   * ```
   */
  verifyEmail(otp: string) {
    return this.http.post<void>(`${this.base}/verify-email`, { otp }, { withCredentials: true });
  }

  /**
   * Requests a new email verification code for the current user.
   *
   * @returns Observable that completes when the backend sends or queues a new verification code.
   *
   * @example
   * ```ts
   * authService.resendVerification().subscribe();
   * ```
   */
  resendVerification() {
    return this.http.post<void>(`${this.base}/resend-verification`, {}, { withCredentials: true });
  }
}
