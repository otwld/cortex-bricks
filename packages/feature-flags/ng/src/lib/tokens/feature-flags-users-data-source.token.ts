import { InjectionToken, Provider, Type } from '@angular/core';

/**
 * Minimal contract for a user directory used in feature targeting.
 */
export interface FeatureFlagUserSummary {
  id: string;
  display: string;
}

/**
 * Data source used by the targeting dialog to resolve users.
 */
export interface FeatureFlagUsersDataSource {
  /**
   * Searches users by free text. Pagination optional.
   */
  search(term: string, page?: number, pageSize?: number): Promise<FeatureFlagUserSummary[]>;
}

/**
 * Injection token for user search used by feature-targeting UI.
 */
export const FEATURE_FLAG_USERS_DATA_SOURCE_TOKEN = new InjectionToken<FeatureFlagUsersDataSource>(
  'FEATURE_FLAG_USERS_DATA_SOURCE_TOKEN',
);

/**
 * Registers a FeatureFlagUsersDataSource implementation in DI.
 */
export function provideFeatureFlagUsersDataSource(existing: Type<FeatureFlagUsersDataSource>, deps: unknown[] = []): Provider {
  return {
    provide: FEATURE_FLAG_USERS_DATA_SOURCE_TOKEN,
    useClass: existing,
    deps,
  };
}
