import { AuthModel, AuthStatus } from "./auth.model";

export const initialAuthState: AuthModel = {
  user: null,
  status: AuthStatus.UN_INITIALIZED,
  error: null,
  returnUri: null,
  lastActivity: Date.now()
};