import type { PipelineStage } from 'mongoose';

import type {
  MatchRule,
  MongooseFilterQuery,
} from '../types/match-rule';

/**
 * Builds a `$match` stage from a DTO and a set of match rules.
 *
 * Rules mutate a MongoDB filter in-place for maximal flexibility.
 */
export function buildMatchStage<TEntity, TDto>(
  dto: TDto,
  rules: readonly MatchRule<TEntity, TDto>[],
): PipelineStage.Match {
  const match: MongooseFilterQuery<TEntity> = {};
  for (const rule of rules) rule(match, dto);
  return { $match: match };
}
