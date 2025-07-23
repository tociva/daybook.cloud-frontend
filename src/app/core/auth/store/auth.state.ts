import { User } from 'oidc-client-ts';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  returnUrl: string | null;
  tokenExpiring: boolean;
  lastActivity: number;
}

export const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  returnUrl: null,
  tokenExpiring: false,
  lastActivity: Date.now()
};