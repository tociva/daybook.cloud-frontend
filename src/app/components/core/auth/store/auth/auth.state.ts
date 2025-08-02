import { AuthModel } from "./auth.model";

export const initialAuthState: AuthModel = {
  user: null,
  status: 'uninitialized',
  error: null,
  returnUri: null,
  lastActivity: Date.now()
};