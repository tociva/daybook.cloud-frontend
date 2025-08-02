export interface AuthConfig {
  issuer: string;
  authority: string;
  clientId: string;
  redirectUri: string;
  postLoginRedirect: string;
  scope: string;
  silentRedirectUri: string;
  hydraLogoutRedirectUri: string;
  kratosUrl: string;
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