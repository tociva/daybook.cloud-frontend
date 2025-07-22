import { createAction, props } from '@ngrx/store';
import { AppUser, Tokens } from './auth.state';

// User wants to login (maybe triggered by a UI button)
export const login = createAction('[Auth] Login');

// Guard or UI requests redirect to login, providing the current URL as callback
export const loginRedirect = createAction(
  '[Auth] Login Redirect',
  props<{ callbackUrl: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: AppUser; tokens: Tokens }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

export const logout = createAction('[Auth] Logout');
export const logoutSuccess = createAction('[Auth] Logout Success');
