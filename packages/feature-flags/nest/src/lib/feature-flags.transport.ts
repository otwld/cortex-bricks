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

export interface FeatureFlagConditionMetaEntry {
  subject: string;
  meta: ResolvedSubjectMeta;
}

type RequestWithHeaders = Pick<Request, 'headers'>;

export function filterFeatureFlagsByScope(features: FeatureFlagDto[], scope?: FeatureScope): FeatureFlagDto[] {
  return scope ? features.filter((feature) => feature.scope === scope) : features;
}

export function withRequestHeaders<T extends FeatureFlagAppContext | FeatureFlagUserContext>(
  context: T,
  request?: RequestWithHeaders,
): FeatureFlagContext {
  return {
    ...context,
    headers: request?.headers,
  };
}

export function toConditionMetaEntries(map: ResolvedConditionMetaMap): FeatureFlagConditionMetaEntry[] {
  return Object.entries(map).map(([subject, meta]) => ({ subject, meta }));
}
