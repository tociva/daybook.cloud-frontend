import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { from, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

import { getUserManager, isUserManagerInitialized } from './user-manager-singleton';
import { authActions } from './store/auth/auth.actions';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  const router = inject(Router);

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
            store.dispatch(authActions.logoutHydra());
          }
          return throwError(() => err);
        })
      );
    })
  );
};
