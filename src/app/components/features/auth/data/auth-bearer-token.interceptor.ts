import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import type { AppConfig } from '../../../../core/config/app-config.model';
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

  if (config) {
    return attachTokenIfNeeded(request, next, authService, config);
  }

  return from(appConfigStore.load()).pipe(
    switchMap((loadedConfig) =>
      loadedConfig
        ? attachTokenIfNeeded(request, next, authService, loadedConfig)
        : next(request),
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
    switchMap((token) => {
      if (!token) {
        return next(request);
      }

      return next(
        request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
    }),
  );
}
