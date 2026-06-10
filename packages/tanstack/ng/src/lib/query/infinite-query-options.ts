import type { PaginationQuery } from '@otwld/ts-sdk';
import { QueryKey, infiniteQueryOptions as _infiniteQueryOptions } from '@tanstack/angular-query-experimental';

import { AsyncOperation, resolveAsyncOperation } from './async-operation';
import { BackendPaginatedResult, getNextPageParam, selectPaginatedResponse } from './infinite-query';
import { runSkippableQuery } from './run-skippable-query';
import { Skippable, isSkipped } from './skippable';

/**
 * Page parameter type used by this package's infinite-query helpers.
 */
type PageParam = number;

/**
 * Argument bag for {@link infiniteQueryOptions}.
 */
export interface InfiniteQueryOptionsArgs<
  TDto extends { pagination?: PaginationQuery },
  TQueryKey extends QueryKey,
  TQueryFnItem,
  TBaseItem = TQueryFnItem,
> {
  /**
   * Query function returning a backend page `{ data, pagination }`.
   */
  queryFn: (dto: TDto) => AsyncOperation<BackendPaginatedResult<TQueryFnItem>>;

  /**
   * Builds a TanStack query key from a (potentially skippable) DTO.
   */
  queryKey: (dto: Skippable<TDto>) => TQueryKey;

  /**
   * Optional default page mapper applied before any per-item mapper override.
   */
  defaultMapper?: (page: BackendPaginatedResult<TQueryFnItem>) => BackendPaginatedResult<TBaseItem>;
}

/**
 * Runtime input accepted when building infinite query options from a factory.
 */
export type InfiniteQueryOptionsBuildArgs<TDto, TItem> = {
  dto: Skippable<TDto>;
  mapper?: (item: TItem) => unknown;
};

/**
 * Creates an infinite-query-options factory with the same UX as `queryOptions`,
 * but for paginated backends returning `{ data, pagination }`.
 *
 * Pipeline:
 *
 * rawPage (BackendPaginatedResult<TQueryFnItem>)
 *   -> defaultMapper (optional) => BackendPaginatedResult<TBaseItem>
 *   -> mapper override (optional) => BackendPaginatedResult<TOutItem>
 *   -> selectPaginatedResponse => { items, pagination }
 *
 * Type rules:
 * - If `defaultMapper` is provided, the factory output defaults to its return type (`TBaseItem` items).
 * - Otherwise, the factory output defaults to `TQueryFnItem` items.
 * - If an override `mapper` is provided at call-site, it receives `TBaseItem` items (default-mapped if present,
 *   otherwise raw), and its return type becomes the final item type.
 */
export function infiniteQueryOptions<
  TDto extends { pagination?: PaginationQuery },
  TQueryKey extends QueryKey,
  TQueryFnItem,
>(
  queryFn: (dto: TDto) => AsyncOperation<BackendPaginatedResult<TQueryFnItem>>,
  queryKey: (dto: Skippable<TDto>) => TQueryKey,
): {
  (
    dto: Skippable<TDto>,
  ): ReturnType<
    typeof _infiniteQueryOptions<
      BackendPaginatedResult<TQueryFnItem>,
      Error,
      ReturnType<typeof selectPaginatedResponse<TQueryFnItem>>,
      TQueryKey,
      PageParam
    >
  >;
  <TOutItem>(
    dto: Skippable<TDto>,
    mapper: (item: TQueryFnItem) => TOutItem,
  ): ReturnType<
    typeof _infiniteQueryOptions<
      BackendPaginatedResult<TOutItem>,
      Error,
      ReturnType<typeof selectPaginatedResponse<TOutItem>>,
      TQueryKey,
      PageParam
    >
  >;
};

/**
 * Creates an infinite-query-options factory with a default page mapper.
 */
export function infiniteQueryOptions<
  TDto extends { pagination?: PaginationQuery },
  TQueryKey extends QueryKey,
  TQueryFnItem,
  TBaseItem,
>(
  queryFn: (dto: TDto) => AsyncOperation<BackendPaginatedResult<TQueryFnItem>>,
  queryKey: (dto: Skippable<TDto>) => TQueryKey,
  defaultMapper: (page: BackendPaginatedResult<TQueryFnItem>) => BackendPaginatedResult<TBaseItem>,
): {
  (
    dto: Skippable<TDto>,
  ): ReturnType<
    typeof _infiniteQueryOptions<
      BackendPaginatedResult<TBaseItem>,
      Error,
      ReturnType<typeof selectPaginatedResponse<TBaseItem>>,
      TQueryKey,
      PageParam
    >
  >;
  <TOutItem>(
    dto: Skippable<TDto>,
    mapper: (item: TBaseItem) => TOutItem,
  ): ReturnType<
    typeof _infiniteQueryOptions<
      BackendPaginatedResult<TOutItem>,
      Error,
      ReturnType<typeof selectPaginatedResponse<TOutItem>>,
      TQueryKey,
      PageParam
    >
  >;
};

/**
 * Builds infinite query options that request the selected page and flatten the
 * selected pages into a `PaginatedResult`.
 */
export function infiniteQueryOptions<
  TDto extends { pagination?: PaginationQuery },
  TQueryKey extends QueryKey,
  TQueryFnItem,
  TBaseItem = TQueryFnItem,
>(
  queryFn: (dto: TDto) => AsyncOperation<BackendPaginatedResult<TQueryFnItem>>,
  queryKey: (dto: Skippable<TDto>) => TQueryKey,
  defaultMapper?: (page: BackendPaginatedResult<TQueryFnItem>) => BackendPaginatedResult<TBaseItem>,
) {
  if (defaultMapper) {
    return function buildWithDefaultMapper(dto: Skippable<TDto>, mapper?: (item: TBaseItem) => unknown) {
      const initialPageParam = getInitialPage(dto);

      if (!mapper) {
        return _infiniteQueryOptions({
          queryKey: queryKey(dto),
          initialPageParam,
          queryFn: runSkippableQuery(dto, async (realDto, page) => {
            const rawPage = await resolveAsyncOperation(queryFn(withPage(realDto, page ?? 1)));
            return defaultMapper(rawPage);
          }),
          getNextPageParam,
          select: (data) => selectPaginatedResponse(data),
        });
      }

      return _infiniteQueryOptions({
        queryKey: queryKey(dto),
        initialPageParam,
        queryFn: runSkippableQuery(dto, async (realDto, page) => {
          const rawPage = await resolveAsyncOperation(queryFn(withPage(realDto, page ?? 1)));
          return mapBackendPage(defaultMapper(rawPage), mapper);
        }),
        getNextPageParam,
        select: (data) => selectPaginatedResponse(data),
      });
    };
  }

  return function buildWithoutDefaultMapper(dto: Skippable<TDto>, mapper?: (item: TQueryFnItem) => unknown) {
    const initialPageParam = getInitialPage(dto);

    if (!mapper) {
      return _infiniteQueryOptions({
        queryKey: queryKey(dto),
        initialPageParam,
        queryFn: runSkippableQuery(dto, async (realDto, page) => {
          const rawPage = await resolveAsyncOperation(queryFn(withPage(realDto, page ?? 1)));
          return rawPage;
        }),
        getNextPageParam,
        select: (data) => selectPaginatedResponse(data),
      });
    }

    return _infiniteQueryOptions({
      queryKey: queryKey(dto),
      initialPageParam,
      queryFn: runSkippableQuery(dto, async (realDto, page) => {
        const rawPage = await resolveAsyncOperation(queryFn(withPage(realDto, page ?? 1)));
        return mapBackendPage(rawPage, mapper);
      }),
      getNextPageParam,
      select: (data) => selectPaginatedResponse(data),
    });
  };
}

/** @internal */
function mapBackendPage<TItem, TOutItem>(
  page: BackendPaginatedResult<TItem>,
  mapper: (item: TItem) => TOutItem,
): BackendPaginatedResult<TOutItem> {
  return { data: page.data.map(mapper), pagination: page.pagination };
}

/** @internal */
function getInitialPage<TDto extends { pagination?: PaginationQuery }>(dto: Skippable<TDto>): PageParam {
  return isSkipped(dto) ? 1 : (dto.pagination?.page ?? 1);
}

/** @internal */
function withPage<TDto extends { pagination?: PaginationQuery }>(dto: TDto, page: PageParam): TDto {
  return { ...dto, pagination: { ...dto.pagination, page } };
}
