import type { FeatureEvaluationResultDto, FeatureScope } from '@otwld/ts-feature-flags';

/**
 * Runtime snapshot of evaluated flags keyed by feature slug.
 */
export type FeatureFlagState = Record<string, FeatureEvaluationResultDto>;

/**
 * Re-exported scope type for Angular consumers.
 */
export type FeatureFlagScope = FeatureScope;
