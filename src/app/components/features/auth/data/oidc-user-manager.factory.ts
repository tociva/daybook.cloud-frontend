import { Injectable } from '@angular/core';
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { AuthConfig } from '../../../../core/config/app-config.model';

@Injectable({ providedIn: 'root' })
export class OidcUserManagerFactory {
  create(authConfig: AuthConfig): UserManager {
    const silentRedirectUri = `${window.location.origin}/auth/silent-renew`;

    return new UserManager({
      authority: authConfig.authority,
      client_id: authConfig.clientId,
      redirect_uri: authConfig.redirectUri,
      silent_redirect_uri: silentRedirectUri,
      post_logout_redirect_uri: authConfig.postLogoutRedirect,
      response_type: 'code',
      scope: authConfig.scope,
      automaticSilentRenew: true,
      loadUserInfo: false,
      monitorSession: false,
      requestTimeoutInSeconds: 8,
      userStore: new WebStorageStateStore({ store: window.localStorage }),
    });
  }
}
