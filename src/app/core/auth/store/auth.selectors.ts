// auth.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

// Basic selectors
export const selectUser = createSelector(
  selectAuthState,
  (state) => state.user
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state) => state.isAuthenticated
);

export const selectIsLoading = createSelector(
  selectAuthState,
  (state) => state.isLoading
);

export const selectIsInitialized = createSelector(
  selectAuthState,
  (state) => state.isInitialized
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state) => state.error
);

export const selectReturnUrl = createSelector(
  selectAuthState,
  (state) => state.returnUrl
);

export const selectTokenExpiring = createSelector(
  selectAuthState,
  (state) => state.tokenExpiring
);

export const selectLastActivity = createSelector(
  selectAuthState,
  (state) => state.lastActivity
);

// Computed selectors
export const selectAccessToken = createSelector(
  selectUser,
  (user) => user?.access_token || null
);

export const selectIdToken = createSelector(
  selectUser,
  (user) => user?.id_token || null
);

export const selectRefreshToken = createSelector(
  selectUser,
  (user) => user?.refresh_token || null
);

export const selectUserProfile = createSelector(
  selectUser,
  (user) => user?.profile || null
);

export const selectUserEmail = createSelector(
  selectUserProfile,
  (profile) => profile?.email || null
);

export const selectUserName = createSelector(
  selectUserProfile,
  (profile) => profile?.name || profile?.preferred_username || null
);

export const selectTokenExpiresAt = createSelector(
  selectUser,
  (user) => user?.expires_at || null
);

export const selectIsTokenExpired = createSelector(
  selectUser,
  (user) => user ? user.expired : true
);

export const selectTimeUntilExpiry = createSelector(
  selectTokenExpiresAt,
  (expiresAt) => {
    if (!expiresAt) return null;
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, expiresAt - now);
  }
);

export const selectAuthReady = createSelector(
  selectIsInitialized,
  selectIsLoading,
  (isInitialized, isLoading) => isInitialized && !isLoading
);

export const selectCanRefreshToken = createSelector(
  selectRefreshToken,
  selectIsTokenExpired,
  (refreshToken, isExpired) => !!refreshToken && !isExpired
);

// Session health selector
export const selectSessionHealth = createSelector(
  selectIsAuthenticated,
  selectTokenExpiring,
  selectTimeUntilExpiry,
  selectLastActivity,
  (isAuthenticated, tokenExpiring, timeUntilExpiry, lastActivity) => ({
    isAuthenticated,
    tokenExpiring,
    timeUntilExpiry,
    lastActivity,
    sessionAge: Date.now() - lastActivity,
    isSessionActive: Date.now() - lastActivity < 30 * 60 * 1000 // 30 minutes
  })
);