import type { Request } from 'express';

import type {
  FeatureFlagAppContext,
  FeatureFlagContext,
  FeatureFlagDto,
  FeatureFlagUserContext,
  FeatureScope,
  ResolvedConditionMetaMap,
  ResolvedSubjectMeta,
} from '@otwld/ts-feature-flags';

/**
 * Transport-friendly condition metadata entry with the subject key included.
 */
export interface FeatureFlagConditionMetaEntry {
  subject: string;
  meta: ResolvedSubjectMeta;
}

type RequestWithHeaders = Pick<Request, 'headers'>;

/**
 * Returns only feature flags matching the requested scope.
 */
export function filterFeatureFlagsByScope(features: FeatureFlagDto[], scope?: FeatureScope): FeatureFlagDto[] {
  return scope ? features.filter((feature) => feature.scope === scope) : features;
}

/**
 * Adds request headers to an app or user evaluation context.
 */
export function withRequestHeaders<T extends FeatureFlagAppContext | FeatureFlagUserContext>(
  context: T,
  request?: RequestWithHeaders,
): FeatureFlagContext {
  return {
    ...context,
    headers: request?.headers,
  };
}

/**
 * Converts a condition metadata map into GraphQL-friendly subject entries.
 */
export function toConditionMetaEntries(map: ResolvedConditionMetaMap): FeatureFlagConditionMetaEntry[] {
  return Object.entries(map).map(([subject, meta]) => ({ subject, meta }));
}
