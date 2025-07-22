import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { AuthState } from './auth.state';

export const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  tokens: null,
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.login, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.loginSuccess, (state, { user, tokens }) => ({
    ...state,
    loading: false,
    isAuthenticated: true,
    user,
    tokens,
    error: null,
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    isAuthenticated: false,
    error,
  })),
  on(AuthActions.logoutSuccess, () => initialState)
);
