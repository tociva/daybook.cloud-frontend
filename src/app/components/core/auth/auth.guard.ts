import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthStore } from './store/auth/auth.store';

export const authGuard: CanMatchFn = (): boolean | UrlTree => {
  const isAuthed = inject(AuthStore).isLoggedInAndHydrated(); // signal/selector
  // return isAuthed ? true : inject(Router).parseUrl('/auth/login-failure');
  return true;
};
