import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import type { AppConfig, AuthConfig } from '../../../../core/config/app-config.model';
import { AppConfigStore } from '../../../../core/config/app-config.store';
import { AuthService } from './auth.service';

const RETRIED_REQUEST_HEADER = 'X-Auth-Retry';

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/$/, '');

const shouldAttachToken = (request: HttpRequest<unknown>, apiBaseUrl: string): boolean => {
  if (request.headers.has('Authorization')) {
    return false;
  }

  const normalizedBaseUrl = normalizeBaseUrl(apiBaseUrl);
  return request.url.startsWith(normalizedBaseUrl);
};

export const authBearerTokenInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const appConfigStore = inject(AppConfigStore);
  const authService = inject(AuthService);
  const config = appConfigStore.config();

  if (config) {
    return attachTokenIfNeeded(request, next, authService, config);
  }

  return from(appConfigStore.load()).pipe(
    switchMap((loadedConfig) =>
      loadedConfig ? attachTokenIfNeeded(request, next, authService, loadedConfig) : next(request),
    ),
  );
};

function attachTokenIfNeeded(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  config: AppConfig,
): Observable<HttpEvent<unknown>> {
  if (!shouldAttachToken(request, config.apiBaseUrl)) {
    return next(request);
  }

  return from(authService.getAccessToken(config.auth)).pipe(
    switchMap((token) => sendWithToken(request, next, authService, config.auth, token)),
  );
}

function sendWithToken(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  authConfig: AuthConfig,
  token: string | null,
): Observable<HttpEvent<unknown>> {
  const outgoing = token ? withBearer(request, token) : request;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (!shouldAttemptRenewal(error, request)) {
        return throwError(() => error);
      }

      return from(authService.renewSilentlyOnce(authConfig)).pipe(
        switchMap((user) => {
          const refreshedToken = user && !user.expired ? user.access_token : null;
          if (!refreshedToken) {
            return throwError(() => error);
          }

          const retried = withBearer(request, refreshedToken).clone({
            setHeaders: { [RETRIED_REQUEST_HEADER]: '1' },
          });
          return next(retried);
        }),
      );
    }),
  );
}

function withBearer(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function shouldAttemptRenewal(error: unknown, request: HttpRequest<unknown>): boolean {
  if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
    return false;
  }

  // Avoid infinite loops: only retry once per request.
  return !request.headers.has(RETRIED_REQUEST_HEADER);
}
