import { Injectable } from '@angular/core';
import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { AuthConfig } from '../../../../core/config/app-config.model';

@Injectable({ providedIn: 'root' })
export class OidcUserManagerFactory {
  private readonly instances = new Map<string, UserManager>();

  create(authConfig: AuthConfig): UserManager {
    const existing = this.instances.get(authConfig.authority);
    if (existing) {
      return existing;
    }

    const silentRedirectUri = `${window.location.origin}/auth/silent-renew`;

    const manager = new UserManager({
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

    this.instances.set(authConfig.authority, manager);
    return manager;
  }
}
