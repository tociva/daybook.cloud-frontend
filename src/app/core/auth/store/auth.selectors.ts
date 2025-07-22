import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

// 1. Get the auth feature state (make sure this matches your StoreModule setup!)
export const selectAuthState = createFeatureSelector<AuthState>('auth');

// 2. Select if the user is authenticated
export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState) => state.isAuthenticated
);

// 3. Select current user (optional)
export const selectCurrentUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.user
);
