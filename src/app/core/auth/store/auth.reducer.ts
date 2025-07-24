import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,

  // Set loading when auth is initializing or login starts
  on(AuthActions.initializeAuth, state => ({
    ...state,
    isLoading: true,
    error: null
  })),
  on(AuthActions.login, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),
  // Login Success
  on(AuthActions.loginSuccess, (state, { user }) => {
    return {
    ...state,
    user,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    isInitialized: true,
    lastActivity: Date.now()
  }}),

  // Login Failure
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error,
    isInitialized: true
  })),

  // Logout
  on(AuthActions.logout, state => ({
    ...state,
    isLoading: true,
    error: null
  })),
  on(AuthActions.logoutSuccess, state => ({
    ...state,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isInitialized: true
  })),
  on(AuthActions.logoutFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),

  // Set authenticated flag (can be used by effects or OIDC events)
  on(AuthActions.setIsAuthenticated, (state, { isAuthenticated }) => ({
    ...state,
    isAuthenticated
  })),

  // Set loading state
  on(AuthActions.setIsLoading, (state, { isLoading }) => ({
    ...state,
    isLoading
  })),

  // Set initialized flag
  on(AuthActions.setIsInitialized, (state, { isInitialized }) => ({
    ...state,
    isInitialized
  })),

  // Set user directly
  on(AuthActions.setUser, (state, { user }) => ({
    ...state,
    user
  })),

  // Set hydrated state
  on(AuthActions.setIsHydrated, (state, { isHydrated }) => ({
    ...state,
    isHydrated
  })),

  // Set error
  on(AuthActions.setError, (state, { error }) => ({
    ...state,
    error
  })),

  // Set returnUri
  on(AuthActions.setReturnUri, (state, { returnUri }) => ({
    ...state,
    returnUri
  })),

  // Token expiring (could trigger UI or auto-renew)
  on(AuthActions.tokenExpiring, state => ({
    ...state,
    tokenExpiring: true
  })),

  // Set last activity timestamp
  on(AuthActions.setLastActivity, (state, { lastActivity }) => ({
    ...state,
    lastActivity
  })),
  on(AuthActions.handleCallback, state => ({
    ...state,
    isLoading: true,
    error: null
  })),
);
