import { InjectionToken, Provider, Type } from '@angular/core';
import { FeatureFlagAppContext, FeatureFlagUserContext } from '@otwld/ts-feature-flags';

/**
 * Context provider for feature evaluations.
 */
export interface FeatureFlagsContext {
  getAppContext: () => Promise<FeatureFlagAppContext>;
  getUserContext: () => Promise<FeatureFlagUserContext>;
}

export const FEATURE_FLAGS_CONTEXT_TOKEN = new InjectionToken<FeatureFlagsContext>('FEATURE_FLAGS_CONTEXT_TOKEN');

/**
 * Registers a FeatureFlagsContext implementation in DI.
 */
export function provideFeatureFlagsContext(existing: Type<FeatureFlagsContext>, deps: unknown[] = []): Provider {
  return {
    provide: FEATURE_FLAGS_CONTEXT_TOKEN,
    useClass: existing,
    deps,
  };
}
