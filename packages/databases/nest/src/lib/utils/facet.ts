import type { PaginationQuery } from '@otwld/ts-sdk';
import type { PipelineStage } from 'mongoose';

/**
 * Builds a MongoDB aggregation pipeline that wraps subsequent stages inside a `$facet`
 * and returns the facet result **as a raw array**, not inside a field like `data`.
 */
export function buildFacet(
  relationLookups: readonly PipelineStage.FacetPipelineStage[] = [],
  extraFields: readonly PipelineStage.FacetPipelineStage[] = [],
): PipelineStage[] {
  return [
    { $facet: { tmp: [...extraFields, ...relationLookups] } },
    {
      $replaceRoot: {
        newRoot: {
          $ifNull: [{ $arrayElemAt: ['$tmp', 0] }, '$$ROOT'],
        },
      },
    },
    { $unset: 'tmp' },
  ];
}

/**
 * Builds a MongoDB aggregation pipeline that performs pagination inside a `$facet`.
 */
export function buildPaginatedFacet(
  { limit = 1000, page = 1 }: PaginationQuery | undefined = {},
  relationLookups: readonly PipelineStage.FacetPipelineStage[] = [],
  extraFields: readonly PipelineStage.FacetPipelineStage[] = [],
): PipelineStage[] {
  const skip = (page - 1) * limit;

  return [
    {
      $facet: {
        data: [...(limit ? [{ $skip: skip }, { $limit: limit }] : []), ...extraFields, ...relationLookups],
        pagination: [{ $count: 'total' }],
      },
    },
    {
      $addFields: {
        pagination: {
          $let: {
            vars: {
              p: { $arrayElemAt: ['$pagination', 0] },
            },
            in: {
              total: { $ifNull: ['$$p.total', 0] },
              page,
              limit,
              pages: {
                $cond: [
                  { $gt: [{ $ifNull: ['$$p.total', 0] }, 0] },
                  {
                    $cond: [{ $gt: [limit, 0] }, { $ceil: { $divide: [{ $ifNull: ['$$p.total', 0] }, limit] } }, 1],
                  },
                  0,
                ],
              },
            },
          },
        },
      },
    },
    {
      $project: {
        data: 1,
        pagination: 1,
      },
    },
  ];
}
