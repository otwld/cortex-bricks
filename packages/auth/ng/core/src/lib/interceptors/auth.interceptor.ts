import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthStateService } from '../services/auth-state.service';
import { AUTH_CONFIG } from '../tokens/auth-config.token';

type RefreshOutcome = { status: 'success' } | { status: 'failed'; error: unknown };

/**
 * Tracks whether a refresh request is currently in flight for this browser context.
 */
let isRefreshing = false;

/**
 * Emits when the in-flight refresh request has completed and queued requests can retry.
 */
const refreshDone$ = new BehaviorSubject<RefreshOutcome | null>(null);

/**
 * Adds credentials to auth API requests and retries once after a successful session refresh.
 *
 * @param req - Outgoing HTTP request handled by Angular's interceptor chain.
 * @param next - Next interceptor or backend handler in the Angular HTTP pipeline.
 * @returns An HTTP event stream for the credentialed request, including refresh retry behavior on `401`.
 *
 * @example
 * ```ts
 * provideHttpClient(withInterceptors([authInterceptor]));
 * ```
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const config = inject(AUTH_CONFIG);

  const credReq = req.clone({ withCredentials: true });

  return next(credReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);

      if (req.url.includes('/refresh')) {
        authState.clearUser();
        router.navigateByUrl(config.afterLogoutRoute ?? '/auth/login');
        return throwError(() => err);
      }

      if (isRefreshing) {
        return refreshDone$.pipe(
          filter((outcome): outcome is RefreshOutcome => outcome !== null),
          take(1),
          switchMap((outcome) => (outcome.status === 'success' ? next(credReq) : throwError(() => outcome.error))),
        );
      }

      isRefreshing = true;
      refreshDone$.next(null);

      return authService.refresh().pipe(
        switchMap(() => {
          isRefreshing = false;
          refreshDone$.next({ status: 'success' });
          return next(credReq);
        }),
        catchError((refreshErr) => {
          isRefreshing = false;
          refreshDone$.next({ status: 'failed', error: refreshErr });
          authState.clearUser();
          router.navigateByUrl(config.afterLogoutRoute ?? '/auth/login');
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
