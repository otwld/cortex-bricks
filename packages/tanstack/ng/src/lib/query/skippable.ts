/**
 * Represents a value that can either be a concrete input of type `T`
 * or `skip`, which indicates that the associated
 * query or operation should be skipped.
 *
 * This is commonly used when building data-access utilities or query
 * definitions that need to conditionally disable execution based on
 * runtime conditions.
 *
 * @typeParam T - The underlying value type when the operation should proceed.
 *
 * @example
 * ```ts
 *
 * interface JobOfferSearchParams {
 *   companyId: string;
 * }
 *
 * const params: Skippable<JobOfferSearchParams> =
 *   selectedCompany ? { companyId: selectedCompany } : 'skip';
 *
 * const query = queryOptions({
 *   queryKey: ['jobOffers', params],
 *   queryFn: () => skippable(params, (p) => fetchJobOffers(p)),
 * });
 * ```
 */
export type Skippable<T> = T | 'skip';

/**
 * Checks whether the provided value is `skip`.
 *
 * This is useful when building reusable data-access helpers that need to
 * short-circuit execution when the consumer intentionally wants to skip a query.
 *
 * @param value - The value to test.
 * @returns `true` if the value is exactly `skip`, otherwise `false`.
 */
export function isSkipped(value: unknown): value is 'skip' {
  return value === 'skip';
}
