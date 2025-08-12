import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, ActionCreator } from '@ngrx/store';
import { catchError, finalize, map, Observable, of, switchMap } from 'rxjs';
import { ToastStore } from '../components/shared/store/toast/toast.store';
import { UiStore } from '../state/ui/ui.store';

// For simpler usage, let's create a more straightforward version
export function handleHttpEffect<T>(
  options: {
    trigger: ActionCreator;
    actionName: string;
    httpCall: (http: HttpClient, action: any) => Observable<T>;
    onSuccess: (data: T) => Action;
    onError: (error: any) => Action;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  return createEffect(() => {
    const actions$ = inject(Actions);
    const http = inject(HttpClient);
    const toast = inject(ToastStore);
    const ui = inject(UiStore);

    return actions$.pipe(
      ofType(options.trigger),
      switchMap((action) => {
        const token = `${options.actionName}-${Date.now()}-${Math.random()}`;
        ui.startLoading(token);

        return options.httpCall(http, action).pipe(
          map((data) => {
            if (options.successMessage) toast.show({title: options.successMessage, message: ''}, 'success');
            return options.onSuccess(data);
          }),
          catchError((error) => {
            if (options.errorMessage) toast.show({title: options.errorMessage, message: error.message}, 'error');
            return of(options.onError(error));
          }),
          finalize(() => ui.stopLoading(token))
        );
      })
    );
  }, { functional: true });
}

// Alternative version if you want non-dispatching effects (for side effects only)
export function handleHttpEffectNonDispatching<T>(
  options: {
    trigger: ActionCreator;
    actionName: string;
    httpCall: (http: HttpClient, action: any) => Observable<T>;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  return createEffect(() => {
    const actions$ = inject(Actions);
    const http = inject(HttpClient);
    const toast = inject(ToastStore);
    const ui = inject(UiStore);

    return actions$.pipe(
      ofType(options.trigger),
      switchMap((action) => {
        const token = `${options.actionName}-${Date.now()}-${Math.random()}`;
        ui.startLoading(token);

        return options.httpCall(http, action).pipe(
          map((data) => {
            if (options.successMessage) toast.show({title: options.successMessage, message: ''}, 'success');
            if (options.onSuccess) options.onSuccess(data);
            return data;
          }),
          catchError((error) => {
            if (options.errorMessage) toast.show({title: options.errorMessage, message: error.message}, 'error');
            if (options.onError) options.onError(error);
            return of(error);
          }),
          finalize(() => ui.stopLoading(token))
        );
      })
    );
  }, { functional: true, dispatch: false });
}
