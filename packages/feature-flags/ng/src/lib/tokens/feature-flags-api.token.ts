import { InjectionToken, Provider, Type } from '@angular/core';
import type {
  FeatureEvaluationResultDto,
  FeatureFlagAppContext,
  FeatureFlagDto,
  FeatureFlagUpsertDto,
  FeatureFlagUserContext,
  FeatureScope,
  ResolvedConditionMetaMap,
} from '@otwld/ts-feature-flags';
import type { Observable } from 'rxjs';

/**
 * Client-side contract for the feature flags API.
 */
export interface FeatureFlagsApi {
  list(scope?: FeatureScope): Observable<FeatureFlagDto[]>;
  listEnabledForApp(context: FeatureFlagAppContext): Observable<FeatureEvaluationResultDto[]>;
  listEnabledForUser(context: FeatureFlagUserContext): Observable<FeatureEvaluationResultDto[]>;
  upsert(dto: FeatureFlagUpsertDto): Observable<FeatureFlagDto>;
  toggle(name: string, enabled: boolean): Observable<FeatureFlagDto>;
  remove(name: string): Observable<{ ok: boolean }>;
  getConditionMeta(scope: FeatureScope): Observable<ResolvedConditionMetaMap>;
}

export const FEATURE_FLAGS_API_TOKEN = new InjectionToken<FeatureFlagsApi>('FEATURE_FLAGS_API_TOKEN');

/**
 * Registers a concrete FeatureFlagsApi implementation in DI.
 */
export function provideFeatureFlagsApi(existing: Type<FeatureFlagsApi>, deps: unknown[] = []): Provider {
  return {
    provide: FEATURE_FLAGS_API_TOKEN,
    useClass: existing,
    deps,
  };
}
