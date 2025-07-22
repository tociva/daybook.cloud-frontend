export interface AuthConfig {
  issuer: string;
  authority: string;
  clientId: string;
  redirectUri: string;
  postLoginRedirect: string;
  loginUrl: string;
  scope: string;
}
  
  export interface ConfigModel {
    auth: AuthConfig;
    apiBaseUrl: string;
  }
  