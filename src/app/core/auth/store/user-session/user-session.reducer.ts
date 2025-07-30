import { createReducer, on } from '@ngrx/store';
import * as UserSessionActions from './user-session.actions';
import { UserSession } from './user-session.models';

export interface UserSessionState {
  session: UserSession | null;
  error: any;
}

export const initialState: UserSessionState = {
  session: null,
  error: null,
};

export const userSessionReducer = createReducer(
  initialState,
  on(UserSessionActions.loadUserSessionSuccess, (state, { session }) => ({
    ...state,
    session,
    error: null,
  })),
  on(
    UserSessionActions.loadUserSessionFailure,
    UserSessionActions.loadUserSession,
    UserSessionActions.createUserSession,
    UserSessionActions.selectOrganization,
    UserSessionActions.selectBranch,
    UserSessionActions.selectFiscalYear,
    UserSessionActions.deleteUserSession,
    (state, action) => ({
      ...state,
      error: null,
    })
  ),
  on(UserSessionActions.clearUserSession, (state) => ({
    ...state,
    session: null,
    error: null,
  }))
);
