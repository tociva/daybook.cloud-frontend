import { createAction, props } from '@ngrx/store';
import { User } from 'oidc-client-ts';

// Authentication Actions
export const initializeAuth = createAction('[Auth] Initialize');
export const initializeAuthSuccess = createAction(
  '[Auth] Initialize Success',
  props<{ user: User | null }>()
);
export const initializeAuthFailure = createAction(
  '[Auth] Initialize Failure',
  props<{ error: string }>()
);

// Login Actions
export const login = createAction('[Auth] Login');
export const loginRedirect = createAction('[Auth] Login Redirect');
export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User }>()
);
export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// Callback Actions
export const handleCallback = createAction('[Auth] Handle Callback');
export const handleCallbackSuccess = createAction(
  '[Auth] Handle Callback Success',
  props<{ user: User; returnUrl?: string }>()
);
export const handleCallbackFailure = createAction(
  '[Auth] Handle Callback Failure',
  props<{ error: string }>()
);

// Silent Renewal Actions
export const handleSilentCallback = createAction('[Auth] Handle Silent Callback');
export const silentRenewal = createAction('[Auth] Silent Renewal');
export const silentRenewalSuccess = createAction(
  '[Auth] Silent Renewal Success',
  props<{ user: User }>()
);
export const silentRenewalFailure = createAction(
  '[Auth] Silent Renewal Failure',
  props<{ error: string }>()
);

// Token Management
export const tokenExpiring = createAction('[Auth] Token Expiring');
export const tokenExpired = createAction('[Auth] Token Expired');
export const refreshToken = createAction('[Auth] Refresh Token');

// User Management
export const userLoaded = createAction(
  '[Auth] User Loaded',
  props<{ user: User }>()
);
export const userUnloaded = createAction('[Auth] User Unloaded');

// Logout Actions
export const logout = createAction('[Auth] Logout');
export const logoutSuccess = createAction('[Auth] Logout Success');
export const logoutFailure = createAction(
  '[Auth] Logout Failure',
  props<{ error: string }>()
);

// Session Management
export const sessionChanged = createAction('[Auth] Session Changed');
export const checkSession = createAction('[Auth] Check Session');