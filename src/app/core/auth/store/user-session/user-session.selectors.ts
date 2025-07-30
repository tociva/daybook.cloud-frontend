import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserSessionState } from './user-session.reducer';

export const selectUserSessionState = createFeatureSelector<UserSessionState>('userSession');

export const selectUserSession = createSelector(
  selectUserSessionState,
  (state) => state.session
);

export const selectUserSessionError = createSelector(
  selectUserSessionState,
  (state) => state.error
);
