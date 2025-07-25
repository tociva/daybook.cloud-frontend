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
  
  export interface ConfigModel {
    auth: AuthConfig;
    apiBaseUrl: string;
  }
  