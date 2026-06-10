/**
 * Safely unwraps a variable inside a query `select` function by ensuring that
 * the value is neither `null` nor `undefined`.
 *
 * This helper is primarily intended for usage inside query transformation
 * functions (`select`), where the variable may incorrectly be `undefined`
 * because:
 * - the `queryFn` executed while required inputs were missing,
 * - the query was not properly guarded using `enabled`,
 * - the query used a conditional skip mechanism but still computed `select`.
 *
 * By throwing early and explicitly, this function prevents silent bugs and
 * enforces correct query design (e.g., using `skipToken`, `{ enabled }`,
 * or guarding dependent values).
 *
 * ### Example (Angular Query / TanStack Query)
 * ```ts
 *  protected readonly currentSiteWithWeatherDataQuery = injectQuery(() => {
 *     const latestWeatherData = this.weatherDataQuery.data();
 *     const sites = this.activatedSitesQuery.data();
 *     const currentPage = this.currentPageIndex();
 *
 *     return queryOptions({
 *       queryKey: ['home-sites'],
 *       queryFn: latestWeatherData && sites ? () => Promise.resolve(true) : skipToken,
 *       select: () => {
 *         const site = safeSelectVar(sites).filter((site) => site.activated)[currentPage];
 *         return { site, weatherData: safeSelectVar(latestWeatherData).filter((v) => v.siteId === site._id) };
 *       },
 *     });
 *   });
 * ```
 *
 * @template T
 * @param {T} variable
 *   The variable to validate. If it is `null` or `undefined`, an error is thrown.
 *
 * @returns {NonNullable<T>}
 *   The same variable, but typed as non-nullable. This ensures downstream
 *   code can safely access properties without manual null checks.
 *
 * @throws {Error}
 *   If `variable` is `null` or `undefined`. The error includes guidance about
 *   misconfigured `queryFn`, `enabled`, or skip conditions.
 */
export function safeSelectVar<T>(variable: T): NonNullable<T> {
  if (variable === null || variable === undefined) {
    const errorMessage =
      `The variable you tried to access safely inside a query 'select' function is undefined or null. ` +
      `Verify that your queryFn is correctly guarded (e.g., using 'enabled' or skip conditions).`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return variable as NonNullable<T>;
}
