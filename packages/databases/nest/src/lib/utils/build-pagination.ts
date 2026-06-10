import type { PaginationInfo } from '@otwld/ts-sdk';

/**
 * Builds pagination metadata based on the current page, limit, and total count.
 */
export function buildPagination(page: number, limit: number, total: number): PaginationInfo {
  return {
    page,
    limit,
    total,
    pages: limit === 0 ? 1 : Math.ceil(total / limit),
  };
}
