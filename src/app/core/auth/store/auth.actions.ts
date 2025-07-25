
import { createAction, props } from '@ngrx/store';
import { User } from 'oidc-client-ts';

// Called when the app initializes or OIDC config is loaded
export const initializeAuth = createAction('[Auth] Initialize');

// User begins login process
export const login = createAction('[Auth] Login', props<{ returnUri?: string }>());

// User login successful
export const loginSuccess = createAction('[Auth] Login Success', props<{ user: User }>());

// User login failed
export const loginFailure = createAction('[Auth] Login Failure', props<{ error: string }>());

// User logged out
export const logoutHydra = createAction('[Auth] Logout Hydra');
export const logoutKratos = createAction('[Auth] Logout Kratos');

// User logout completed
export const logoutSuccess = createAction('[Auth] Logout Success');

// User logout failed
export const logoutFailure = createAction('[Auth] Logout Failure', props<{ error: string }>());

// Set authenticated flag
export const setIsAuthenticated = createAction('[Auth] Set Is Authenticated', props<{ isAuthenticated: boolean }>());

// Set loading state
export const setIsLoading = createAction('[Auth] Set Is Loading', props<{ isLoading: boolean }>());

// Set initialized state
export const setIsInitialized = createAction('[Auth] Set Is Initialized', props<{ isInitialized: boolean }>());

// Set user
export const setUser = createAction('[Auth] Set User', props<{ user: User | null }>());

// Set hydrated state
export const setIsHydrated = createAction('[Auth] Set Is Hydrated', props<{ isHydrated: boolean }>());

// Set error
export const setError = createAction('[Auth] Set Error', props<{ error: string | null }>());

// Set return URL
export const setReturnUri = createAction('[Auth] Set Return Uri', props<{ returnUri: string | null }>());

// Token expiring soon
export const tokenExpiring = createAction('[Auth] Token Expiring');

// Update last activity timestamp
export const setLastActivity = createAction('[Auth] Set Last Activity', props<{ lastActivity: number }>());

// For when OIDC callback handling begins
export const handleCallback = createAction('[Auth] Handle Callback');

export const handleLogoutCallback = createAction('[Auth] Handle Logout Callback');

export const handleSilentCallback = createAction('[Auth] Handle Silent Callback');

// Silent login
export const silentRenew = createAction('[Auth] Silent Renew');

// Silent login success
export const silentRenewSuccess = createAction('[Auth] Silent Renew Success', props<{ user: User }>());

// Silent login failure
export const silentRenewFailure = createAction('[Auth] Silent Renew Failure', props<{ error: string }>());

export const performRedirect = createAction('[Auth] Perform Redirect', props<{ returnUri: string }>());
  