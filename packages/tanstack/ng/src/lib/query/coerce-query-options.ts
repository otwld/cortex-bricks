import { CreateQueryOptions, QueryKey, queryOptions } from '@tanstack/angular-query-experimental';

/**
 * Converts plain array data or existing query options into TanStack query
 * options.
 *
 * Plain arrays are wrapped in a disabled query by default so components can
 * consume static data through the same shape as live query options.
 */
export function coerceQueryOptions<TItem>(
  value: CoercibleQueryInput<TItem>,
  config?: {
    queryKey?: QueryKey;
    /**
     * Optional enabled flag for the fake query (default: false)
     */
    enabled?: boolean;
  },
) {
  // Case 1: caller already passed a full options object
  if (typeof value === 'object' && value !== null && 'queryKey' in value) {
    // We "forget" the concrete queryKey type here – that's fine at this layer.
    return value as QueryOptions<TItem, QueryKey>;
  }

  // Case 2: caller passed a plain array => wrap into 1 fake page
  const { queryKey = [Date.now()] as QueryKey, enabled = false } = config || {};

  return queryOptions<TItem[], Error, TItem[], QueryKey>({
    enabled,
    initialData: value,
    queryKey,
    queryFn: async () => value,
  });
}

/**
 * Query-options shape accepted by coercion helpers.
 */
export type QueryOptions<TItem, TQueryKey extends QueryKey> = CreateQueryOptions<
  TItem[] | TItem,
  Error,
  TItem[] | TItem,
  TQueryKey
>;

/**
 * Input accepted by `coerceQueryOptions`.
 */
export type CoercibleQueryInput<TItem> =
  | TItem[]
  | CreateQueryOptions<TItem[] | TItem, Error, TItem[] | TItem, QueryKey>;
