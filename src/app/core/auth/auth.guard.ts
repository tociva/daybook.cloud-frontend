import { filter } from "rxjs";
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, switchMap, take } from 'rxjs/operators';
import * as AuthActions from './store/auth.actions';
import { selectIsAuthenticated, selectIsInitialized } from './store/auth.selectors';

export const authGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const store = inject(Store);

  return store.select(selectIsInitialized).pipe(
    filter(init => init),
    take(1),
    switchMap(() =>
      store.select(selectIsAuthenticated).pipe(take(1))
    ),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      } else {
        store.dispatch(AuthActions.setReturnUri({ returnUri: state.url }));
        store.dispatch(AuthActions.login());
        return false;
      }
    })
  );
};
