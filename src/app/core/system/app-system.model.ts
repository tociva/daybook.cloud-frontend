export type AppStartupStatus =
  | 'idle'
  | 'loading-config'
  | 'config-loaded'
  | 'auth-provider-unavailable'
  | 'processing-login-callback'
  | 'login-success'
  | 'loading-user-session'
  | 'user-session-ready'
  | 'user-session-error'
  | 'checking-session'
  | 'session-active'
  | 'session-missing'
  | 'logging-out'
  | 'logged-out'
  | 'logout-error'
  | 'redirecting-to-login'
  | 'redirecting-to-bootstrap'
  | 'redirecting-to-subscription'
  | 'redirecting-to-dashboard'
  | 'config-load-error'
  | 'session-error'
  | 'login-error';

export interface AppSystemModel {
  configLoaded: boolean;
  startupStatus: AppStartupStatus;
  error: string | null;
}
