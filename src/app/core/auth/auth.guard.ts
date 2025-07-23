// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { map, take, switchMap, filter } from 'rxjs/operators';
import { AuthFacade } from './service/auth-facade.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authFacade:AuthFacade = inject(AuthFacade);

  return authFacade.authReady$.pipe(
    filter((ready) => !!ready),
    take(1),
    switchMap(() => authFacade.isAuthenticated$),
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      } else {
        localStorage.setItem('returnUrl', state.url);
        authFacade.login();
        return false;
      }
    })
  );
};
