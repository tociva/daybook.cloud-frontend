import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiErrorMessageService } from './api-error-message.service';
import { ApiError } from './api-error.model';
import { normalizeApiError } from './api-error.util';

export const apiErrorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const messageService = inject(ApiErrorMessageService);

  return next(request).pipe(
    catchError((error: unknown) => {
      const normalized = normalizeApiError(error, {
        translate: (messageKey, params, locale) =>
          messageService.translate(messageKey, params, locale),
      });

      logServerError(normalized);
      return throwError(() => normalized);
    }),
  );
};

function logServerError(error: ApiError): void {
  if (error.statusCode < 500) {
    return;
  }

  console.error('[API] Request failed', {
    code: error.code,
    method: error.method,
    path: error.path,
    requestId: error.requestId,
    statusCode: error.statusCode,
    timestamp: error.timestamp,
  });
}
