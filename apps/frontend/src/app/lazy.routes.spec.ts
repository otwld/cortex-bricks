import { authGuard } from '@otwld/ng-auth/core';
import { dashboardPrimeNgRoutes } from './lazy.routes';

describe('dashboardPrimeNgRoutes', () => {
  it('requires authentication before loading the dashboard layout', () => {
    expect(authGuard).toEqual(expect.any(Function));
    expect(Array.isArray(dashboardPrimeNgRoutes[0].canActivate)).toBe(true);
    expect(dashboardPrimeNgRoutes[0].canActivate).toEqual([authGuard]);
  });
});
