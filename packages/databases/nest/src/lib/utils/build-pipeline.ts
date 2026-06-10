import type { PipelineStage } from 'mongoose';

/**
 * Combines match, sort, and facet stages into a reusable pipeline.
 *
 * @param match - A `$match` stage.
 * @param sort - A `$sort` stage.
 * @param facet - Output from `buildPaginatedFacet()` or `buildFacet()`.
 *
 * @returns Aggregation pipeline: `[match, sort, ...facet]`.
 */
export function buildPipeline(
  match: PipelineStage,
  sort: PipelineStage,
  facet: PipelineStage[] = [],
): PipelineStage[] {
  return [match, sort, ...facet];
}
