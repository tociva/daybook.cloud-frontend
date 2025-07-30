import { User } from 'oidc-client-ts';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  isHydrated: boolean;
  error: string | null;
  returnUri: string | null;
  tokenExpiring: boolean;
  lastActivity: number;
}

export const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  isHydrated: false,
  error: null,
  returnUri: null,
  tokenExpiring: false,
  lastActivity: Date.now()
};