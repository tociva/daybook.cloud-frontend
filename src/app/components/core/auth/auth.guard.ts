import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthStore } from './store/auth/auth.store';
import { Store } from '@ngrx/store';
import { authActions } from './store/auth/auth.actions';

export const authGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authStore = inject(AuthStore);
  const ngrxStore = inject(Store);

  return toObservable(authStore.status).pipe(
    filter((status) => status !== 'uninitialized' && status !== 'initializing'), // wait until ready
    take(1),
    map((status) => {
      const isAuthenticated =
        status === 'authenticated' || status === 'hydrated';

      if (isAuthenticated) {
        return true;
      }

      ngrxStore.dispatch(authActions.login({ returnUri: state.url }));
      return false;
    })
  );
};
