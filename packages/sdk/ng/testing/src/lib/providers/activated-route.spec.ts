import type { ValueProvider } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { provideActivatedRoute } from './activated-route';

describe(provideActivatedRoute.name, () => {
  it('provides route params, query params, data, and matching snapshot maps', () => {
    const provider = provideActivatedRoute({
      data: { title: 'Dashboard' },
      fragment: 'details',
      params: { id: 'user-1' },
      queryParams: { tab: 'profile' },
    }) as ValueProvider;

    const route = provider.useValue as ActivatedRoute;

    expect(provider.provide).toBe(ActivatedRoute);
    expect(route.snapshot.params).toEqual({ id: 'user-1' });
    expect(route.snapshot.paramMap.get('id')).toBe('user-1');
    expect(route.snapshot.queryParams).toEqual({ tab: 'profile' });
    expect(route.snapshot.queryParamMap.get('tab')).toBe('profile');
    expect(route.snapshot.data).toEqual({ title: 'Dashboard' });
    expect(route.snapshot.fragment).toBe('details');
  });
});
