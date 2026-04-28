import { UserSessionStateModel } from './user-session.model';

export interface UserSessionState {
  userSession: UserSessionStateModel;
}

export const initialUserSessionState: UserSessionState = {
  userSession: {
    error: null,
    isLoading: false,
    session: null,
  },
};
