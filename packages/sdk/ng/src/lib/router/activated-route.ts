import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Recursively reads route params from the current `ActivatedRoute` and all its parents.
 *
 * The closest (deepest) route that defines the param wins.
 *
 * @example
 * const { jobOfferId, companyId } = injectRecursiveRouteParams('jobOfferId', 'companyId');
 *
 * // jobOfferId: string | null
 * // companyId: string | null
 */
export function injectRecursiveRouteParams<const T extends readonly string[]>(
  ...paramNames: T
): { [K in T[number]]: string | null } {
  const activatedRoute = inject(ActivatedRoute);

  // Initialize all requested params with null
  const result = Object.fromEntries(paramNames.map((name) => [name, null])) as { [K in T[number]]: string | null };

  let route: ActivatedRoute | null = activatedRoute;

  // Walk up the route tree (current -> parent -> grandparent...)
  while (route) {
    const params = route.snapshot.params;

    for (const name of paramNames) {
      // Only set if we don't already have a value (closest route wins)
      if (!result[name as T[number]]) {
        const value = params[name];
        if (value !== null) {
          result[name as T[number]] = value;
        }
      }
    }

    route = route.parent ?? null;
  }

  return result;
}

/**
 * Reads recursive route params and throws if any requested param is missing.
 */
export function injectRecursiveRouteParamsSafe<const T extends readonly string[]>(
  ...paramNames: T
): { [K in T[number]]: string } {
  const params = injectRecursiveRouteParams(...paramNames);

  for (const paramsKey in params) {
    if (!params[paramsKey as keyof typeof params])
      throw new Error(`The required route param (${paramsKey}) is missing.`);
  }

  return params as { [K in T[number]]: string };
}

/**
 * Recursively reads query params from the current `ActivatedRoute` and all its parents.
 *
 * The closest (deepest) route that defines the query param wins.
 *
 * @example
 * const { candidateId, applicationId } = injectRecursiveRouteQueryParams('candidateId', 'applicationId');
 *
 * // candidateId: string | null
 * // applicationId: string | null
 */
export function injectRecursiveRouteQueryParams<const T extends readonly string[]>(
  ...paramNames: T
): { [K in T[number]]: string | null } {
  const activatedRoute = inject(ActivatedRoute);

  // Initialize all requested params with null
  const result = Object.fromEntries(paramNames.map((name) => [name, null])) as { [K in T[number]]: string | null };

  let route: ActivatedRoute | null = activatedRoute;

  // Walk up the route tree (current -> parent -> grandparent...)
  while (route) {
    const queryParams = route.snapshot.queryParams;

    for (const name of paramNames) {
      // Only set if we don't already have a value (closest route wins)
      if (!result[name as T[number]]) {
        const value = queryParams[name];
        if (value !== null && value !== undefined) {
          result[name as T[number]] = value;
        }
      }
    }

    route = route.parent ?? null;
  }

  return result;
}

/**
 * Reads recursive query params and throws if any requested param is missing.
 */
export function injectRecursiveRouteQueryParamsSafe<const T extends readonly string[]>(
  ...paramNames: T
): { [K in T[number]]: string } {
  const params = injectRecursiveRouteQueryParams(...paramNames);

  for (const paramsKey in params) {
    if (!params[paramsKey as keyof typeof params])
      throw new Error(`The required query param (${paramsKey}) is missing.`);
  }

  return params as { [K in T[number]]: string };
}
