import { HttpErrorResponse } from '@angular/common/http';
import { QueryFunction, SkipToken, skipToken } from '@tanstack/angular-query-experimental';

import { Skippable, isSkipped } from './skippable';
/**
 * Internal type used by toolkit/ng-tanstack.
 */


type PageParam = number;

/**
 * Executes a query only when the provided DTO is not skipped.
 * Also normalizes Angular `HttpErrorResponse` into a standard `Error`.
 *
 * @typeParam TDto - DTO type.
 * @typeParam TResult - Query result type.
 */
export function runSkippableQuery<TDto, TResult>(
  dto: Skippable<TDto>,
  queryFn: (dto: TDto, pageParam?: PageParam) => Promise<TResult>,
): QueryFunction<TResult, readonly unknown[], unknown> | SkipToken {
  if (isSkipped(dto)) return skipToken;

  return async ({ pageParam }) => {
    try {
      return await queryFn(dto, toPageParam(pageParam));
    } catch (error: unknown) {
      throw normalizeAngularHttpError(error);
    }
  };
}

/** @internal */
function toPageParam(pageParam: unknown): PageParam {
  return typeof pageParam === 'number' && Number.isFinite(pageParam) ? pageParam : 1;
}

/** @internal */
function normalizeAngularHttpError(error: unknown): unknown {
  if (!(error instanceof HttpErrorResponse)) return error;

  const message =
    (error.error &&
      typeof error.error === 'object' &&
      'message' in error.error &&
      (error.error as { message?: unknown }).message) ??
    error.message ??
    'HTTP error';

  return new Error(String(message));
}
