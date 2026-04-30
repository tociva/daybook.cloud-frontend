import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppConfigStore } from '../../../../core/config/app-config.store';
import { AuthService } from './auth.service';

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
  const normalizedBaseUrl = config ? normalizeBaseUrl(config.apiBaseUrl) : null;
  const urlMatchesBase = normalizedBaseUrl ? request.url.startsWith(normalizedBaseUrl) : false;

  console.log('[AuthInterceptor] request received', {
    hasAuthorizationHeader: request.headers.has('Authorization'),
    method: request.method,
    normalizedApiBaseUrl: normalizedBaseUrl,
    requestUrl: request.url,
    urlMatchesBase,
  });

  if (!config || !shouldAttachToken(request, config.apiBaseUrl)) {
    console.log('[AuthInterceptor] skipping token attachment', {
      hasConfig: Boolean(config),
      reason: !config
        ? 'missing-config'
        : request.headers.has('Authorization')
          ? 'authorization-already-present'
          : 'url-does-not-match-api-base-url',
    });
    return next(request);
  }

  return from(authService.getAccessToken(config.auth)).pipe(
    switchMap((token) => {
      if (!token) {
        console.log('[AuthInterceptor] no access token available');
        return next(request);
      }

      console.log('[AuthInterceptor] attaching bearer token');
      return next(
        request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
    }),
  );
};
