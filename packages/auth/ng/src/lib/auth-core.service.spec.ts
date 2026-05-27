import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AUTH_CONFIG, AuthService, AuthStateService, AuthUser } from '@otwld/ng-auth/core';

const user: AuthUser = {
  _id: 'user-1',
  email: 'user@example.com',
  emailVerified: true,
  roles: [],
  permissions: [],
};

describe(AuthService.name, () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AUTH_CONFIG, useValue: { apiUrl: '/api/auth', afterLogoutRoute: '/auth/login' } },
        AuthService,
        AuthStateService,
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('clears stale auth state and finishes loading when current-user lookup is unauthorized', async () => {
    const service = TestBed.inject(AuthService);
    const state = TestBed.inject(AuthStateService);
    const http = TestBed.inject(HttpTestingController);

    state.setUser(user);
    state.setLoading(true);

    const promise = firstValueFrom(service.getMe());
    http.expectOne('/api/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });

    await expect(promise).rejects.toMatchObject({ status: 401 });
    expect(state.user()).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
    expect(state.loading()).toBe(false);
  });

  it('clears local auth state and navigates to login even when logout is rejected', async () => {
    const service = TestBed.inject(AuthService);
    const state = TestBed.inject(AuthStateService);
    const router = TestBed.inject(Router);
    const http = TestBed.inject(HttpTestingController);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    state.setUser(user);

    const promise = firstValueFrom(service.logout());
    http.expectOne('/api/auth/logout').flush({}, { status: 401, statusText: 'Unauthorized' });

    await expect(promise).rejects.toMatchObject({ status: 401 });
    expect(state.user()).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith('/auth/login');
  });
});
