import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { authActions } from './store/auth/auth.actions';
import { getUserManager, isUserManagerInitialized } from './user-manager-singleton';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);

  if (!isUserManagerInitialized()) {
    return next(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          store.dispatch(authActions.logoutHydra());
        }
        return throwError(() => err);
      })
    );
  }

  return from(getUserManager().getUser()).pipe(
    switchMap(user => {
      const token = user?.access_token;
      const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

      return next(authReq).pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 401) {
            if(token){
              store.dispatch(authActions.silentRenew());
            }else{
              store.dispatch(authActions.logoutHydra());
            }
          }
          return throwError(() => err);
        })
      );
    })
  );
};
