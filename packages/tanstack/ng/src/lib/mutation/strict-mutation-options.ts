import { CreateMutationOptions, MutationMeta, mutationOptions } from '@tanstack/angular-query-experimental';
/** CreateMutationOptionsStrict. */


export type CreateMutationOptionsStrict<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TOnMutateResult = unknown,
> = Omit<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>, 'meta'> & { meta: MutationMeta };

/**
 * Our stricter version of TanStack's mutationOptions:
 * - keeps all TanStack types
 * - but requires `meta`
 */
export function strictMutationOptions<TData = unknown, TError = Error, TVariables = void, TOnMutateResult = unknown>(
  opts: CreateMutationOptionsStrict<TData, TError, TVariables, TOnMutateResult>,
) {
  return mutationOptions(opts);
}
