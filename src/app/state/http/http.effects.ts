import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { httpActions } from './http.actions';
import { HttpStore } from './http.store';
import { HttpRequestConfig } from './http.model';
import { ToastStore } from '../../components/shared/store/toast/toast.store';
import { DbcError } from '../../util/types/dbc-error.type';

export const httpEffects = {
  executeRequest: createEffect(() => {
    const actions$ = inject(Actions);
    const http = inject(HttpClient);
    const httpStore = inject(HttpStore);
    const toastStore = inject(ToastStore);

    return actions$.pipe(
      ofType(httpActions.executeRequest),
      switchMap(({ config, metadata }) => {
        // Start loading
        httpStore.startLoading(metadata.requestId);
        
        // Prepare HTTP call based on method
        const httpCall = createHttpCall(http, config);
        return httpCall.pipe(
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
            const errorMessage = errorP.error?.error.message ?? errorP.error?.message ?? errorP.message;
            // Show error message if provided
            if (metadata.errorMessage) {
              toastStore.show({ title: metadata.errorMessage, message:errorMessage }, 'error');
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
    const httpStore = inject(HttpStore);
    const store = inject(Store);
    
    return actions$.pipe(
      ofType(httpActions.requestSuccess),
      tap(({ requestId, data, metadata }) => {
        // Stop loading
        httpStore.stopLoading(requestId);
        
        if (metadata.onSuccessAction) {
          const action = metadata.onSuccessAction(data);
          store.dispatch(action);
        }
      })
    );
  }, { functional: true, dispatch: false }),

  handleFailure: createEffect(() => {
    const actions$ = inject(Actions);
    const httpStore = inject(HttpStore);
    const store = inject(Store);

    return actions$.pipe(
      ofType(httpActions.requestFailure),
      tap(({ requestId, error, metadata }) => {
        // Stop loading and set error
        httpStore.stopLoading(requestId);
        httpStore.setError(requestId, error);
        
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