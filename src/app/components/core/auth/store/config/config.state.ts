import { ConfigModel } from "./config.model";

export const initialConfigState: ConfigModel = {
    config: {
    auth: {
      authority: '',
      clientId: '',
      redirectUri: '',
      scope: '',
      postLogoutRedirect: '',
      },
      apiBaseUrl: '',
    },
    loaded: false,
    error: null,
};