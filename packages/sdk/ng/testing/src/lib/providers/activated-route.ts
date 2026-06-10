import type { Provider } from '@angular/core';
import {
  ActivatedRoute,
  convertToParamMap,
  type ActivatedRouteSnapshot,
  type Data,
  type Params,
} from '@angular/router';
import { of } from 'rxjs';

/**
 * Values used to build an Angular `ActivatedRoute` test double.
 */
export interface ActivatedRouteTestingConfig {
  data?: Data;
  fragment?: string | null;
  params?: Params;
  queryParams?: Params;
  route?: Partial<ActivatedRoute>;
  snapshot?: Partial<ActivatedRouteSnapshot>;
}

/**
 * Provides an `ActivatedRoute` mock with observable and snapshot values.
 */
export function provideActivatedRoute(
  config: ActivatedRouteTestingConfig = {},
): Provider {
  const data = config.data ?? {};
  const fragment = config.fragment ?? null;
  const params = config.params ?? {};
  const queryParams = config.queryParams ?? {};
  const snapshot = {
    data,
    fragment,
    params,
    paramMap: convertToParamMap(params),
    queryParams,
    queryParamMap: convertToParamMap(queryParams),
    ...config.snapshot,
  } as ActivatedRouteSnapshot;

  return {
    provide: ActivatedRoute,
    useValue: {
      data: of(data),
      fragment: of(fragment),
      params: of(params),
      queryParams: of(queryParams),
      snapshot,
      ...config.route,
    } satisfies Partial<ActivatedRoute>,
  };
}
