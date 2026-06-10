import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { FeatureFlagKey, FeatureScope } from '@otwld/ts-feature-flags';

/**
 * Metadata key used by guards to discover required feature flags.
 */
export const FEATURE_FLAG_REQUIREMENT_KEY = 'feature-flags:require';

/**
 * Feature flag requirement stored on a controller or route handler.
 */
export type FeatureFlagRequirement = { name: FeatureFlagKey; scope: FeatureScope };

/**
 * Marks a route/handler as feature-gated.
 * Example: `@RequireFeatureFlag('job-offer-visibility', 'app')`
 */
export const RequireFeatureFlag = (name: FeatureFlagKey, scope: FeatureScope = 'app') =>
  SetMetadata(FEATURE_FLAG_REQUIREMENT_KEY, { name, scope } satisfies FeatureFlagRequirement);

/**
 * Injects the evaluated payload for a given feature into route handlers.
 */
export const FeatureFlagPayload = createParamDecorator((featureName: FeatureFlagKey, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request?.featureFlagPayloads?.[featureName];
});
