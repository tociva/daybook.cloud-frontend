import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { selectConfigState } from '../config/store/config.selectors';
import { ConfigState } from '../config/store/config.reducer';
import { selectIsAuthenticated } from './store/auth.selectors';
import { loginRedirect } from './store/auth.actions';

export const authGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);

  return store.select(selectConfigState).pipe(
    filter((configState: ConfigState) => configState.loaded),
    take(1),
    switchMap((configState) => 
      store.select(selectIsAuthenticated).pipe(
        take(1),
        map((isAuthenticated) => {
          if (isAuthenticated) {
            return true;
          }
          // Instead of redirecting here, dispatch an action
          store.dispatch(loginRedirect({ callbackUrl: window.location.href }));
          return false;
        })
      )
    )
  );
};
