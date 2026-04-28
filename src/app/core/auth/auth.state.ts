import { AuthModel } from './auth.model';

export interface AuthState {
  auth: AuthModel;
}

export const initialAuthState: AuthState = {
  auth: {
    sessionChecked: false,
    isAuthenticated: false,
  },
};

