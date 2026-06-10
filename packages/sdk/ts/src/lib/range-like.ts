/**
 * Generic range type for values that can be compared.
 *
 * Use this in DTOs and filters that map to Mongo or SQL range queries.
 */
export type RangeLike<T = string | Date | number> = Partial<{
  gt: T;
  gte: T;
  lt: T;
  lte: T;
}>;
