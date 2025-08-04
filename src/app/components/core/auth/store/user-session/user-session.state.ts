import { UserSession } from './user-session.model';

export interface UserSessionState {
  session: UserSession | null;
  error: unknown | null;
}

export const initialUserSessionState: UserSessionState = {
  session: null,
  error: null,
};
