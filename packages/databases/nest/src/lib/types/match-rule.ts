import type { PipelineStage } from 'mongoose';

/**
 * MongoDB `$match` filter that accepts known entity fields plus computed
 * aggregation keys such as `$text`.
 */
export type MongooseFilterQuery<TEntity> = PipelineStage.Match['$match'] &
  Partial<Record<Extract<keyof TEntity, string>, unknown>> &
  Record<string, unknown>;

/**
 * Mutation rule that augments a MongoDB match query based on a DTO input.
 */
export type MatchRule<TEntity, TDto> = (
  match: MongooseFilterQuery<TEntity>,
  dto: TDto,
) => void;
