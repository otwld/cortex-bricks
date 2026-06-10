import { Injectable, computed, signal } from '@angular/core';
import type { AuthUser } from '@otwld/ts-auth';

export type { AuthUser } from '@otwld/ts-auth';

/** Stores and derives the current client-side authentication state. */
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
