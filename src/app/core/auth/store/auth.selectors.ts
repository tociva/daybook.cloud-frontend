import { createFeatureSelector, createSelector } from "@ngrx/store";
import { AuthState } from "./auth.state";

export const selectAuthState = createFeatureSelector<AuthState>('auth');
export const selectIsAuthenticated = createSelector(selectAuthState, s => s.isAuthenticated);
export const selectUser = createSelector(selectAuthState, s => s.user);
export const selectIsLoading = createSelector(selectAuthState, s => s.isLoading);
export const selectIsInitialized = createSelector(selectAuthState, s => s.isInitialized);
export const selectAuthError = createSelector(selectAuthState, s => s.error);
export const selectReturnUri = createSelector(selectAuthState, s => s.returnUri);
