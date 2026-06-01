export interface AuthConfig {
  authority: string;
  clientId: string;
  redirectUri: string;
  postLoginRedirect: string | null;
  scope: string;
  postLogoutRedirect: string;
  audience: string | null;
}

export interface AppConfig {
  auth: AuthConfig;
  apiBaseUrl: string;
}
