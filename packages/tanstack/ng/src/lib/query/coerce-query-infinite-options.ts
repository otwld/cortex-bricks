import type { PaginationInfo } from '@otwld/ts-sdk';
import { QueryKey, infiniteQueryOptions } from '@tanstack/angular-query-experimental';

import {
  AnyInfinitePaginatedOptions,
  AnyOptions,
  BackendPaginatedResult,
  InfinitePaginatedOptions,
  PaginatedResult,
  selectPaginatedResponse,
} from './infinite-query';

/**
 * Coerce either:
 * - an array of items `TItem[]`, or
 * - a fully-formed infinite-query options object
 *
 * …into a canonical `InfinitePaginatedOptions<TItem, QueryKey, number>`.
 */
export function coerceQueryInfiniteOptions<TItem>(
  value: CoercibleInfiniteInput<TItem>,
  config?: {
    queryKey?: QueryKey;
    /**
     * Optional initial page param (default: 1)
     */
    initialPageParam?: number;
    /**
     * Optional enabled flag for the fake query (default: false)
     */
    enabled?: boolean;
  },
): InfinitePaginatedOptions<TItem, QueryKey, number> {
  // Case 1: caller already passed a query options object
  if (isQueryOptionsInput(value)) {
    if (isInfiniteQueryOptionsInput(value)) {
      return value;
    }

    const { queryKey = createDefaultQueryKey(), initialPageParam = 1 } = config || {};
    const sourceQueryFn = isSourceQueryFn(value.queryFn) ? value.queryFn : undefined;
    const queryFn = sourceQueryFn
      ? async ({
          client,
          signal,
          meta,
        }: {
          client: SourceQueryFnContext<TItem>['client'];
          signal: SourceQueryFnContext<TItem>['signal'];
          meta: SourceQueryFnContext<TItem>['meta'];
        }) => {
          const result = await sourceQueryFn({
            client,
            signal,
            meta,
            queryKey,
          });

          return toBackendPaginatedResult(result, initialPageParam);
        }
      : undefined;

    return infiniteQueryOptions<BackendPaginatedResult<TItem>, Error, PaginatedResult<TItem>, QueryKey, number>({
      ...(typeof value.enabled === 'boolean' ? { enabled: value.enabled } : {}),
      ...(queryFn ? { queryFn } : {}),
      queryKey,
      initialPageParam,
      getNextPageParam: () => undefined,
      select: (data) => selectPaginatedResponse(data),
    });
  }
  const { queryKey = createDefaultQueryKey(), enabled = false, initialPageParam = 1 } = config || {};

  const pagination: PaginationInfo = {
    page: initialPageParam,
    total: value.length,
    limit: value.length,
    pages: 1,
  };

  const firstPage: BackendPaginatedResult<TItem> = {
    data: value,
    pagination,
  };

  return infiniteQueryOptions<BackendPaginatedResult<TItem>, Error, PaginatedResult<TItem>, QueryKey, number>({
    enabled,
    queryKey,
    initialPageParam,
    getNextPageParam: () => undefined,
    initialData: {
      pages: [firstPage],
      pageParams: [initialPageParam],
    },
    select: (data) => selectPaginatedResponse(data),
  });
}

/**
 * Union type representing everything that can be coerced into
 * an InfinitePaginatedOptions<TItem, TQueryKey>.
 *
 * This removes the boilerplate:
 *   `value: TItem[] | InfinitePaginatedOptions<TItem, TQueryKey>`
 *
 * @template TItem - The type of each item inside the paginated response.
 */
export type CoercibleInfiniteInput<TItem> = TItem[] | AnyInfinitePaginatedOptions<TItem> | AnyOptions<TItem>;

function createDefaultQueryKey(): QueryKey {
  return [Date.now()];
}

function isQueryOptionsInput<TItem>(value: CoercibleInfiniteInput<TItem>): value is AnyInfinitePaginatedOptions<TItem> | AnyOptions<TItem> {
  return typeof value === 'object' && value !== null && 'queryKey' in value;
}

function isInfiniteQueryOptionsInput<TItem>(
  value: AnyInfinitePaginatedOptions<TItem> | AnyOptions<TItem>,
): value is AnyInfinitePaginatedOptions<TItem> {
  return 'getNextPageParam' in value;
}

function isSourceQueryFn<TItem>(value: AnyOptions<TItem>['queryFn']): value is SourceQueryFn<TItem> {
  return typeof value === 'function';
}

function toBackendPaginatedResult<TItem>(value: TItem | TItem[] | BackendPaginatedResult<TItem>, page: number): BackendPaginatedResult<TItem> {
  if (isBackendPaginatedResult(value)) {
    return value;
  }

  const data = Array.isArray(value) ? value : [value];
  const pagination: PaginationInfo = {
    page,
    total: data.length,
    limit: data.length,
    pages: 1,
  };

  return { data, pagination };
}

function isBackendPaginatedResult<TItem>(value: TItem | TItem[] | BackendPaginatedResult<TItem>): value is BackendPaginatedResult<TItem> {
  return typeof value === 'object' && value !== null && 'data' in value && 'pagination' in value;
}

type SourceQueryFn<TItem> = Extract<AnyOptions<TItem>['queryFn'], (...args: never[]) => unknown>;
type SourceQueryFnContext<TItem> = Parameters<SourceQueryFn<TItem>>[0];
