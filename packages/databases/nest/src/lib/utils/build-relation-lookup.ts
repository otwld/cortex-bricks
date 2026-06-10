import type { PipelineStage } from 'mongoose';

/**
 * Builds a standard relation lookup pipeline using `$lookup` + `$unwind`.
 *
 * Use this when the foreign field maps to a **single relation**.
 */
export function buildRelationLookup<T, V>(
  from: string,
  localField: Extract<keyof T, string>,
  foreignField: Extract<keyof V, string>,
  as: string,
): PipelineStage.FacetPipelineStage[] {
  return [
    {
      $lookup: {
        from,
        localField,
        foreignField,
        as,
      },
    },
    {
      $unwind: {
        path: `$${as}`,
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
}

/**
 * Builds a relation lookup pipeline for **multi-value relational fields**, where
 * `localField` is an array of foreign `_id`s.
 */
export function buildRelationsLookup<T, V>(
  from: string,
  localField: Extract<keyof T, string>,
  foreignField: Extract<keyof V, string>,
  as: string,
  pipeline: PipelineStage.FacetPipelineStage[] = [],
): PipelineStage.FacetPipelineStage[] {
  return [
    {
      $lookup: {
        from,
        let: { localIds: `$${localField}` },
        as,
        pipeline: [
          {
            $match: {
              $expr: { $in: [`$${foreignField}`, '$$localIds'] },
            },
          },
          ...pipeline,
        ],
      },
    },
  ];
}
