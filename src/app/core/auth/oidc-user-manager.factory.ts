import { Injectable } from '@angular/core';
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { AuthConfig } from '../config/app-config.model';

@Injectable({ providedIn: 'root' })
export class OidcUserManagerFactory {
  create(authConfig: AuthConfig): UserManager {
    return new UserManager({
      authority: authConfig.authority,
      client_id: authConfig.clientId,
      redirect_uri: authConfig.redirectUri,
      post_logout_redirect_uri: authConfig.postLogoutRedirect,
      response_type: 'code',
      scope: authConfig.scope,
      automaticSilentRenew: false,
      loadUserInfo: false,
      monitorSession: false,
      requestTimeoutInSeconds: 8,
      userStore: new WebStorageStateStore({ store: window.localStorage }),
    });
  }
}
