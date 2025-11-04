import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthStore } from './store/auth/auth.store';

export const authGuard: CanMatchFn = (): boolean | UrlTree => {
  const authStore = inject(AuthStore);
  const isAuthed = authStore.isLoggedInAndHydrated();
  if(!isAuthed){
    const url = window.location.pathname + window.location.search;
    authStore.setReturnUri(url);
    return inject(Router).parseUrl('/auth/validate');
  }
  return true;
};
