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
  const actions$ = inject(Actions);
  const http = inject(HttpClient);
  const toast = inject(ToastStore);
  const ui = inject(UiStore);

  return createEffect(() => {
    return actions$.pipe(
      ofType(options.trigger),
      switchMap((action) => {
        const token = `${options.actionName}-${Date.now()}-${Math.random()}`;
        ui.startLoading(token);

        return options.httpCall(http, action).pipe(
          map((data) => {
            if (options.successMessage) toast.show(options.successMessage, 'success');
            return options.onSuccess(data);
          }),
          catchError((error) => {
            if (options.errorMessage) toast.show(options.errorMessage, 'error');
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
  const actions$ = inject(Actions);
  const http = inject(HttpClient);
  const toast = inject(ToastStore);
  const ui = inject(UiStore);

  return createEffect(() => {
    return actions$.pipe(
      ofType(options.trigger),
      switchMap((action) => {
        const token = `${options.actionName}-${Date.now()}-${Math.random()}`;
        ui.startLoading(token);

        return options.httpCall(http, action).pipe(
          map((data) => {
            if (options.successMessage) toast.show(options.successMessage, 'success');
            if (options.onSuccess) options.onSuccess(data);
            return data;
          }),
          catchError((error) => {
            if (options.errorMessage) toast.show(options.errorMessage, 'error');
            if (options.onError) options.onError(error);
            return of(error);
          }),
          finalize(() => ui.stopLoading(token))
        );
      })
    );
  }, { functional: true, dispatch: false });
}

// Example usage:
/*
// Make sure your onSuccess and onError functions CALL the action creators:
const loadUsersEffect = handleHttpEffect({
  trigger: userActions.loadUsers,
  actionName: 'loadUsers',
  httpCall: (http, action) => http.get<User[]>('/api/users'),
  onSuccess: (users) => userActions.loadUsersSuccess({ users }), // Call the action creator
  onError: (error) => userActions.loadUsersFailure({ error: error.message }), // Call the action creator
  successMessage: 'Users loaded successfully',
  errorMessage: 'Failed to load users'
});

// For non-dispatching effects that update signal stores directly:
const loadUsersEffectNonDispatching = handleHttpEffectNonDispatching({
  trigger: userActions.loadUsers,
  actionName: 'loadUsers',
  httpCall: (http, action) => http.get<User[]>('/api/users'),
  onSuccess: (users) => userStore.setUsers(users), // Update signal store directly
  onError: (error) => console.error(error),
  successMessage: 'Users loaded successfully',
  errorMessage: 'Failed to load users'
});
*/