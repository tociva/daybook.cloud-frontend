// auth.reducer.ts
import { createReducer, on } from '@ngrx/store';
import { AuthState, initialAuthState } from './auth.state';
import * as AuthActions from './auth.actions';

export const authReducer = createReducer(
  initialAuthState,

  // Initialize Auth
  on(AuthActions.initializeAuth, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.initializeAuthSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: !!user && !user.expired,
    isLoading: false,
    isInitialized: true,
    error: null
  })),

  on(AuthActions.initializeAuthFailure, (state, { error }) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: true,
    error
  })),

  // Login
  on(AuthActions.login, AuthActions.loginRedirect, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.loginSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    lastActivity: Date.now()
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error
  })),

  // Callback
  on(AuthActions.handleCallback, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.handleCallbackSuccess, (state, { user, returnUrl }) => ({
    ...state,
    user,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    returnUrl: returnUrl || null,
    lastActivity: Date.now()
  })),

  on(AuthActions.handleCallbackFailure, (state, { error }) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error,
    returnUrl: null
  })),

  // Silent Renewal
  on(AuthActions.silentRenewal, (state) => ({
    ...state,
    error: null
  })),

  on(AuthActions.silentRenewalSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    error: null,
    tokenExpiring: false,
    lastActivity: Date.now()
  })),

  on(AuthActions.silentRenewalFailure, (state, { error }) => ({
    ...state,
    error,
    tokenExpiring: false
  })),

  // User Events
  on(AuthActions.userLoaded, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    error: null,
    lastActivity: Date.now()
  })),

  on(AuthActions.userUnloaded, (state) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    tokenExpiring: false
  })),

  // Token Management
  on(AuthActions.tokenExpiring, (state) => ({
    ...state,
    tokenExpiring: true
  })),

  on(AuthActions.tokenExpired, (state) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    tokenExpiring: false,
    error: 'Token expired'
  })),

  // Logout
  on(AuthActions.logout, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.logoutSuccess, (state) => ({
    ...initialAuthState,
    isInitialized: true
  })),

  on(AuthActions.logoutFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),

  // Session Management
  on(AuthActions.sessionChanged, (state) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    error: 'Session changed'
  }))
);