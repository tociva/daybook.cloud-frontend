import { ConfigModel } from "./config.model";

export const initialConfigState: ConfigModel = {
    config: {
    auth: {
      issuer: '',
      authority: '',
      clientId: '',
      redirectUri: '',
      postLoginRedirect: '',
      scope: '',
      silentRedirectUri: '',
      hydraLogoutRedirectUri: '',
        kratosUrl: '',
      },
      apiBaseUrl: '',
    },
    loaded: false,
    error: null,
};