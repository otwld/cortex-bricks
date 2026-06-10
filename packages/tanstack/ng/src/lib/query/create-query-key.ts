/**
 * Internal type used by toolkit/ng-tanstack.
 */
type QueryKeyParams = Record<string, unknown> | string;
/**
 * Internal type used by toolkit/ng-tanstack.
 */

type WithExtra<TParams, TExtra extends object> = TParams extends object ? TParams & TExtra : TParams;
/**
 * Internal type used by toolkit/ng-tanstack.
 */


type QueryKeyBuilder<TBase extends string, TParams> = <TExtra extends object = object>(
  params?: WithExtra<TParams, TExtra>,
) => readonly [TBase] | readonly [TBase, WithExtra<TParams, TExtra>];
/**
 * Internal type used by toolkit/ng-tanstack.
 */


type QueryKeyFactory<TBase extends string, TDefs extends Record<string, (arg?: unknown) => QueryKeyParams>> = {
  [K in keyof TDefs]: QueryKeyBuilder<TBase, ReturnType<TDefs[K]>>;
};

/**
 * Build a typed collection of query-key factories with optional per-call extensions.
 */
export function createQueryKey<
  TBase extends string,
  TDefs extends Record<string, (arg?: unknown) => QueryKeyParams>,
>(base: TBase, defs: TDefs): QueryKeyFactory<TBase, TDefs> {
  const result = {} as QueryKeyFactory<TBase, TDefs>;

  (Object.keys(defs) as Array<keyof TDefs>).forEach((key) => {
    const build = ((params?: unknown) => (params ? [base, params] : [base])) as QueryKeyFactory<TBase, TDefs>[typeof key];
    result[key] = build;
  });

  return result;
}
