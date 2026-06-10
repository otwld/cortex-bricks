import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, catchError, firstValueFrom, of } from 'rxjs';

import type { FeatureFlagState, FeatureFlagScope } from './feature-flags.types';
import { FEATURE_FLAGS_API_TOKEN } from './tokens/feature-flags-api.token';
import { FEATURE_FLAGS_CONTEXT_TOKEN } from './tokens/feature-flags-context.token';

/**
 * Signals-based client-side facade for feature flags.
 * - Keeps a session-scoped snapshot of app and user flags.
 * - Delegates network calls to the injected FeatureFlagsApi.
 * - No local persistence; the API remains the source of truth.
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private readonly api = inject(FEATURE_FLAGS_API_TOKEN);
  private readonly contexts = inject(FEATURE_FLAGS_CONTEXT_TOKEN);
  private readonly app = signal<FeatureFlagState>({});
  private readonly user = signal<FeatureFlagState>({});

  /**
   * Load-completion subjects for app and user feature snapshots.
   */
  public readonly loaded = {
    app: new BehaviorSubject(false),
    user: new BehaviorSubject(false),
  };

  /**
   * Prefetches enabled app-scoped features and stores them in the app snapshot.
   */
  async loadAppFlags(): Promise<void> {
    try {
      const context = await this.contexts.getAppContext();
      const results = await firstValueFrom(this.api.listEnabledForApp(context));

      const map: FeatureFlagState = {};
      results.forEach((result) => {
        if (result.slug && result.enabled) {
          map[result.slug] = result;
        }
      });

      this.app.set(map);
    } catch {
      this.app.set({});
    } finally {
      this.loaded.app.next(true);
    }
  }

  /**
   * Prefetches enabled user-scoped features and stores them in the user snapshot.
   */
  async loadUserFlags(): Promise<void> {
    try {
      const context = await this.contexts.getUserContext();
      const results = await firstValueFrom(
        this.api.listEnabledForUser(context).pipe(catchError(() => of([]))),
      );

      const map: FeatureFlagState = {};
      results.forEach((result) => {
        if (result.slug && result.enabled) {
          map[result.slug] = result;
        }
      });

      this.user.set(map);
    } catch {
      this.user.set({});
    } finally {
      this.loaded.user.next(true);
    }
  }

  /** Clears user-scoped flags (call on logout). */
  clearUserFlags(): void {
    this.user.set({});
  }

  /**
   * Returns whether a feature is enabled in the given scope snapshot.
   * For `user` scope, this reads from the last call to `loadUserFlags`.
   */
  isEnabled(slug: string, scope: FeatureFlagScope = 'app'): false | Record<string, unknown> {
    const source = scope === 'app' ? this.app() : this.user();
    const feature = source[slug];
    return feature?.enabled ? ((feature.payload || {}) as Record<string, unknown>) : false;
  }

  /**
   * Returns the raw payload for a feature in the given scope, if any.
   */
  payload<T = unknown>(slug: string, scope: FeatureFlagScope = 'app'): T | undefined {
    const source = scope === 'app' ? this.app() : this.user();
    return source[slug]?.payload as T | undefined;
  }

  /** Returns a shallow copy of the user-scoped features snapshot. */
  getFeaturesForUser(): FeatureFlagState {
    return { ...this.user() };
  }

  /** Forces re-fetch of app features (useful after admin toggles). */
  async refreshApp(): Promise<void> {
    await this.loadAppFlags();
  }

  /** Forces re-fetch of user features using default resolvers. */
  async refreshUser(): Promise<void> {
    await this.loadUserFlags();
  }
}
