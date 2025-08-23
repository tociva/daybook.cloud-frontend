import { inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { of, EMPTY } from 'rxjs';
import { httpActions } from './http.actions';
import { HttpStore } from './http.store';
import { HttpRequestConfig } from './http.model';
import { ToastStore } from '../../components/shared/store/toast/toast.store';
import { DbcError } from '../../util/types/dbc-error.type';

// Helper function to detect abort-like errors (same logic as in HttpStore)
function isAbortLike(err: unknown): boolean {
  // fetch-style AbortController
  if (err && typeof err === 'object' && (err as any).name === 'AbortError') return true;
  if (err instanceof DOMException && err.name === 'AbortError') return true;

  // Firefox NS_BINDING_ABORTED - check error message
  if (err && typeof err === 'object') {
    const message = (err as any).message || '';
    if (typeof message === 'string' && message.includes('NS_BINDING_ABORTED')) return true;
  }

  // Angular HttpClient (XHR)
  if (err instanceof HttpErrorResponse) {
    const pe = err.error as ProgressEvent | undefined;
    
    // Explicit abort event
    if (pe?.type === 'abort') return true;
    
    // Firefox NS_BINDING_ABORTED often comes as HttpErrorResponse
    if (err.message && err.message.includes('NS_BINDING_ABORTED')) return true;
    
    // Status 0 with abort-like conditions
    if (err.status === 0) {
      if (pe?.type === 'error' || pe?.type === 'abort' || pe?.type === '') {
        if (err.message.includes('abort') || 
            err.message.includes('cancel') || 
            err.message.includes('NS_BINDING_ABORTED') ||
            err.statusText === '' || 
            err.statusText === 'Unknown Error') {
          return true;
        }
      }
    }
  }

  // Check for other common cancellation indicators
  if (err && typeof err === 'object') {
    const errObj = err as any;
    if (errObj.cancelled === true || errObj.canceled === true) return true;
    if (errObj.code === 'ABORT' || errObj.code === 'CANCELLED') return true;
  }

  return false;
}

export const httpEffects = {
  executeRequest: createEffect(() => {
    const actions$ = inject(Actions);
    const http = inject(HttpClient);
    const httpStore = inject(HttpStore);
    const toastStore = inject(ToastStore);

    return actions$.pipe(
      ofType(httpActions.executeRequest),
      switchMap(({ config, metadata }) => {
        // Create HTTP call
        const httpCall = createHttpCall(http, config);
        
        // Use HttpStore.track() for proper loading/error handling including abort detection
        return httpStore.track(metadata.requestId, httpCall).pipe(
          map((data) => {
            // Show success message if provided
            if (metadata.successMessage) {
              toastStore.show({ title: 'Success', message: metadata.successMessage }, 'success');
            }
            return httpActions.requestSuccess({ 
              requestId: metadata.requestId, 
              data, 
              metadata 
            });
          }),
          catchError((errorP) => {
            // Double-check: if it's an abort error that somehow got through, ignore it
            if (isAbortLike(errorP)) {
              return EMPTY; // Silently ignore abort errors
            }

            const errorMessage = errorP.error?.error?.message ?? errorP.error?.message ?? errorP.message;
            
            // Show error message if provided (only for real errors)
            if (metadata.errorMessage) {
              toastStore.show({ title: metadata.errorMessage, message: errorMessage }, 'error');
            }
            
            const error: DbcError = {
              details: errorMessage ?? 'Unknown error',
              title: metadata.errorMessage ?? 'Error thrown from cloud server'
            };
            
            return of(httpActions.requestFailure({ 
              requestId: metadata.requestId, 
              error, 
              metadata 
            }));
          })
        );
      })
    );
  }, { functional: true }),

  handleSuccess: createEffect(() => {
    const actions$ = inject(Actions);
    const store = inject(Store);
    
    return actions$.pipe(
      ofType(httpActions.requestSuccess),
      tap(({ data, metadata }) => {
        // Note: Loading is already stopped by HttpStore.track()
        if (metadata.onSuccessAction) {
          const action = metadata.onSuccessAction(data);
          store.dispatch(action);
        }
      })
    );
  }, { functional: true, dispatch: false }),

  handleFailure: createEffect(() => {
    const actions$ = inject(Actions);
    const store = inject(Store);

    return actions$.pipe(
      ofType(httpActions.requestFailure),
      tap(({ error, metadata }) => {
        // Note: Loading is already stopped and error is already set by HttpStore.track()
        if (metadata.onErrorAction) {
          const action = metadata.onErrorAction(error);
          store.dispatch(action);
        }
      })
    );
  }, { functional: true, dispatch: false })
};

function createHttpCall(http: HttpClient, config: HttpRequestConfig) {
  const { url, method, body, headers, params } = config;
  const options = { headers, params };

  switch (method) {
    case 'GET':
      return http.get(url, options);
    case 'POST':
      return http.post(url, body, options);
    case 'PUT':
      return http.put(url, body, options);
    case 'PATCH':
      return http.patch(url, body, options);
    case 'DELETE':
      return http.delete(url, options);
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
}