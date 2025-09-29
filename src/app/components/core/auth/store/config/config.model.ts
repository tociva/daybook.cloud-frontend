export interface AuthConfig {
  authority: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  postLogoutRedirect: string;
}

export interface EnvConfig {
  auth: AuthConfig;
  apiBaseUrl: string;
}

export interface ConfigModel {
  config: EnvConfig;
  loaded: boolean;
  error: string | null;
}