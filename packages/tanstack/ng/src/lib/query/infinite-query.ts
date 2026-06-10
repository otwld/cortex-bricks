import type { PaginationInfo } from '@otwld/ts-sdk';
import type {
  CreateInfiniteQueryOptions,
  CreateQueryOptions,
  InfiniteData,
  QueryKey,
} from '@tanstack/angular-query-experimental';

/** Backend page shape returned by paginated APIs. */
export interface BackendPaginatedResult<T> {
  data: T[];
  pagination: PaginationInfo;
}

/** Flattened page shape exposed to consuming UI code. */
export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationInfo;
}

/** Resolve the next page number from backend pagination metadata. */
export function getNextPageParam<T>({ pagination }: BackendPaginatedResult<T>): number | undefined {
  return pagination.page < pagination.pages ? pagination.page + 1 : undefined;
}

/**
 * Flattens a TanStack Query `InfiniteData` of paginated results into a single page-like shape.
 *
 * - Concatenates all `data` arrays across `pages` in order.
 * - Returns the **latest** page's `pagination` metadata (useful for "next page" decisions).
 * - Optionally maps each item with a provided `mapper`, preserving type safety via overloads.
 *
 * @typeParam T - The item type within each page of the server response.
 * @typeParam O - The mapped item type when a `mapper` is provided.
 *
 * @example
 * // Without mapper → items: JobOfferWithRelationsDto[]
 * const { items, pagination } = selectPaginatedResponse<JobOfferWithRelationsDto>(data);
 *
 * @example
 * // With mapper → items: JobOfferViewModel[]
 * const { items, pagination } = selectPaginatedResponse<JobOfferWithRelationsDto, JobOfferViewModel>(data, dto =>
 *   toViewModel(dto),
 * );
 */

// Overload: no mapper → items: T[]
export function selectPaginatedResponse<T>(input: InfiniteData<BackendPaginatedResult<T>>): PaginatedResult<T>;

// Overload: with mapper → items: O[]
export function selectPaginatedResponse<T, O>(
  input: InfiniteData<BackendPaginatedResult<T>>,
  mapper: (item: T) => O,
): PaginatedResult<O>;

/** @internal Implementation signature */
export function selectPaginatedResponse<T, O>(
  { pages }: InfiniteData<BackendPaginatedResult<T>>,
  mapper?: (item: T) => O,
) {
  const flat: T[] = pages.flatMap((p) => p.data);

  const pagination: PaginationInfo =
    pages.length > 0 ? pages[pages.length - 1].pagination : { page: 1, limit: 0, total: 0, pages: 1 };

  if (mapper) {
    const items = flat.map(mapper);
    return { items, pagination };
  }

  return { items: flat, pagination };
}
/** Shared infinite-query options shape used by paginated helpers in this package. */
export type InfinitePaginatedOptions<
  TItem,
  TQueryKey extends QueryKey,
  TPageParam = number,
> = CreateInfiniteQueryOptions<BackendPaginatedResult<TItem>, Error, PaginatedResult<TItem>, TQueryKey, TPageParam>;
/** Infinite query options with package-default error, key, and page-param types. */
export type AnyInfinitePaginatedOptions<TItem> = CreateInfiniteQueryOptions<
  BackendPaginatedResult<TItem>,
  Error,
  PaginatedResult<TItem>,
  QueryKey,
  number
>;
/** Query options accepted by coercion helpers when a full query object is passed in. */
export type AnyOptions<TItem> =
  | CreateQueryOptions<TItem, Error, TItem, QueryKey>
  | CreateQueryOptions<TItem[], Error, TItem[], QueryKey>;
