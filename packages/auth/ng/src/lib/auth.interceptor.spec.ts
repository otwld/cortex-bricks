import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { authInterceptor } from '../../core/src/lib/interceptors/auth.interceptor';
import { AuthService } from '../../core/src/lib/services/auth.service';
import { AuthStateService } from '../../core/src/lib/services/auth-state.service';
import { AUTH_CONFIG } from '../../core/src/lib/tokens/auth-config.token';

describe('authInterceptor', () => {
  it('errors queued 401 requests when the shared refresh request fails', () => {
    const initialUnauthorized = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    const refreshError = new HttpErrorResponse({ status: 401, statusText: 'Refresh Unauthorized' });
    const refreshResult = new Subject<unknown>();
    const refresh = vi.fn(() => refreshResult.asObservable());
    const clearUser = vi.fn();
    const navigateByUrl = vi.fn().mockResolvedValue(true);
    const backend: HttpHandlerFn = vi.fn(() => throwError(() => initialUnauthorized)) as unknown as HttpHandlerFn;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { refresh } },
        { provide: AuthStateService, useValue: { clearUser } },
        { provide: Router, useValue: { navigateByUrl } },
        { provide: AUTH_CONFIG, useValue: { apiUrl: '/api/auth', afterLogoutRoute: '/auth/login' } },
      ],
    });

    const firstErrors: unknown[] = [];
    const secondErrors: unknown[] = [];

    TestBed.runInInjectionContext(() => {
      authInterceptor(new HttpRequest('GET', '/api/first'), backend).subscribe({ error: (error) => firstErrors.push(error) });
      authInterceptor(new HttpRequest('GET', '/api/second'), backend).subscribe({ error: (error) => secondErrors.push(error) });
    });

    refreshResult.error(refreshError);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(firstErrors).toEqual([refreshError]);
    expect(secondErrors).toEqual([refreshError]);
    expect(clearUser).toHaveBeenCalledTimes(1);
    expect(navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });
});
