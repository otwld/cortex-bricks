/**
 * Pagination input for list queries.
 */
export type PaginationQuery = Readonly<{
  /** Page number (1-based). */
  page?: number;

  /** Number of items per page. Use 0 to disable pagination. */
  limit?: number;
}>;

/**
 * Pagination metadata for list responses.
 */
export type PaginationInfo = Readonly<{
  page: number;
  limit: number;
  total: number;
  pages: number;
}>;

/**
 * Standard paginated result shape.
 */
export type PaginationResult<T> = Readonly<{
  data: readonly T[];
  pagination: PaginationInfo;
}>;
