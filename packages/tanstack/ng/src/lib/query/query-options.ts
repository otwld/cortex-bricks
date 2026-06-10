import { QueryKey, queryOptions as _queryOptions } from '@tanstack/angular-query-experimental';

import { AsyncOperation, resolveAsyncOperation } from './async-operation';
import { runSkippableQuery } from './run-skippable-query';
import { Skippable } from './skippable';

/**
 * Creates a typed TanStack query-options factory without a default mapper.
 */
export function queryOptions<TQueryKey extends QueryKey, TDto, TQueryFnData>(
  queryFn: (dto: TDto) => AsyncOperation<TQueryFnData>,
  queryKey: (dto: Skippable<TDto>) => TQueryKey,
): {
  (dto: Skippable<TDto>): ReturnType<typeof _queryOptions<TQueryFnData, Error, TQueryFnData, TQueryKey>>;
  <TOut>(
    dto: Skippable<TDto>,
    mapper: (data: TQueryFnData) => TOut,
  ): ReturnType<typeof _queryOptions<TQueryFnData, Error, TOut, TQueryKey>>;
};

/**
 * Creates a typed TanStack query-options factory with a default mapper applied
 * before optional per-call mapping.
 */
export function queryOptions<TQueryKey extends QueryKey, TDto, TQueryFnData, TBase>(
  queryFn: (dto: TDto) => AsyncOperation<TQueryFnData>,
  queryKey: (dto: Skippable<TDto>) => TQueryKey,
  defaultMapper: (raw: TQueryFnData) => TBase,
): {
  (dto: Skippable<TDto>): ReturnType<typeof _queryOptions<TQueryFnData, Error, TBase, TQueryKey>>;
  <TOut>(
    dto: Skippable<TDto>,
    mapper: (data: TBase) => TOut,
  ): ReturnType<typeof _queryOptions<TQueryFnData, Error, TOut, TQueryKey>>;
};

/**
 * Builds query options that run only when the supplied DTO is not skipped.
 */
export function queryOptions<TQueryKey extends QueryKey, TDto, TQueryFnData, TBase>(
  queryFn: (dto: TDto) => AsyncOperation<TQueryFnData>,
  queryKey: (dto: Skippable<TDto>) => TQueryKey,
  defaultMapper?: (raw: TQueryFnData) => TBase,
) {
  function build(dto: Skippable<TDto>, mapper?: (data: TQueryFnData | TBase) => unknown) {
    return _queryOptions({
      queryKey: queryKey(dto),
      queryFn: runSkippableQuery(dto, async (realDto) => {
        const raw = await resolveAsyncOperation(queryFn(realDto));
        return defaultMapper ? defaultMapper(raw) : raw;
      }),
      select: (data) => (mapper ? mapper(data) : data),
    });
  }

  return build;
}
