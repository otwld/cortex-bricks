import { CreateQueryOptions, QueryKey, queryOptions } from '@tanstack/angular-query-experimental';

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
/** QueryOptions. */


export type QueryOptions<TItem, TQueryKey extends QueryKey> = CreateQueryOptions<
  TItem[] | TItem,
  Error,
  TItem[] | TItem,
  TQueryKey
>;
/** CoercibleQueryInput. */


export type CoercibleQueryInput<TItem> =
  | TItem[]
  | CreateQueryOptions<TItem[] | TItem, Error, TItem[] | TItem, QueryKey>;
