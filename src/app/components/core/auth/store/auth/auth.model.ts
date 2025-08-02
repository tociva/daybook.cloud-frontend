import { User } from 'oidc-client-ts';

export type AuthStatus =
  | 'uninitialized'
  | 'initializing'
  | 'authenticated'
  | 'unauthenticated'
  | 'hydrated'
  | 'tokenExpiring'
  | 'error';

export interface AuthModel {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  returnUri: string | null;
  lastActivity: number;
}
