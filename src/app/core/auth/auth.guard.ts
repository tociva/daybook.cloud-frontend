import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, filter } from "rxjs";
import { map, take } from 'rxjs/operators';
import * as AuthActions from './store/auth.actions';
import { selectIsAuthenticated, selectIsHydrated } from './store/auth.selectors';

export const authGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const store = inject(Store);

  return combineLatest([
    store.select(selectIsHydrated),
    store.select(selectIsAuthenticated)
  ]).pipe(
    filter(([isHydrated, _]) => isHydrated), // Wait until hydration is done
    take(1),
    map(([_, isAuthenticated]) => {
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
