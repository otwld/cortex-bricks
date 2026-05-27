import { Injectable, computed, signal } from '@angular/core';

/**
 * Authenticated user record stored in Angular auth state.
 *
 * @example
 * ```ts
 * const user: AuthUser = {
 *   _id: 'user_1',
 *   email: 'user@example.com',
 *   emailVerified: true,
 *   roles: [{ name: 'admin', permissions: ['manage:Project'] }],
 *   permissions: ['read:Invoice'],
 * };
 * ```
 */
export interface AuthUser {
  /**
   * Stable backend identifier for the user.
   */
  _id: string;

  /**
   * Login and notification email address for the user.
   */
  email: string;

  /**
   * Optional given name displayed before the email address when present.
   */
  firstName?: string;

  /**
   * Optional family name stored for profile display or account management.
   */
  lastName?: string;

  /**
   * Optional avatar image URL for the user.
   */
  avatar?: string;

  /**
   * Whether the user's email address has completed verification.
   */
  emailVerified: boolean;

  /**
   * Roles assigned to the user, each with permission strings in `action:subject` format.
   */
  roles: Array<{ name: string; permissions: string[] }>;

  /**
   * Direct permission strings assigned to the user in `action:subject` format, or `*` for all access.
   */
  permissions: string[];

  /**
   * Optional ISO timestamp for the user's most recent successful login.
   */
  lastLoginAt?: string;
}

/**
 * Stores and derives the current client-side authentication state.
 *
 * @example
 * ```ts
 * authState.setUser(user);
 * const authenticated = authState.isAuthenticated();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  /**
   * Writable signal that stores the current authenticated user or `null` for guests.
   */
  readonly #user = signal<AuthUser | null>(null);

  /**
   * Writable signal that tracks whether the current auth state is still being resolved.
   */
  readonly #loading = signal(true);

  /**
   * Readonly signal exposing the current authenticated user.
   */
  readonly user = this.#user.asReadonly();

  /**
   * Readonly signal exposing auth state loading status.
   */
  readonly loading = this.#loading.asReadonly();

  /**
   * Computed signal that is `true` when a user is present and `false` for guests.
   */
  readonly isAuthenticated = computed(() => this.#user() !== null);

  /**
   * Computed signal that is `true` when the current user has verified their email.
   */
  readonly isEmailVerified = computed(() => this.#user()?.emailVerified ?? false);

  /**
   * Computed signal containing the user's first name, email address, or `null` for guests.
   */
  readonly displayName = computed(() => this.#user()?.firstName ?? this.#user()?.email ?? null);

  /**
   * Replaces the current authenticated user state.
   *
   * @param user - Authenticated user returned by the backend.
   * @returns Nothing.
   *
   * @example
   * ```ts
   * authState.setUser(user);
   * ```
   */
  setUser(user: AuthUser): void {
    this.#user.set(user);
  }

  /**
   * Clears the current authenticated user and returns the state to guest mode.
   *
   * @returns Nothing.
   *
   * @example
   * ```ts
   * authState.clearUser();
   * ```
   */
  clearUser(): void {
    this.#user.set(null);
  }

  /**
   * Updates the auth loading state.
   *
   * @param value - `true` while auth state is being resolved, or `false` once resolution is complete.
   * @returns Nothing.
   *
   * @example
   * ```ts
   * authState.setLoading(false);
   * ```
   */
  setLoading(value: boolean): void {
    this.#loading.set(value);
  }
}
