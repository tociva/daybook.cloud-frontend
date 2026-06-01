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

    // Hydra only stamps an `aud` claim on the access token when the authorize
    // request explicitly asks for it. Passing `audience` as an extra query param
    // (carried through to both the authorize and silent-renew requests) ensures
    // the issued token carries the audience the resource server validates.
    const extraQueryParams = authConfig.audience
      ? { audience: authConfig.audience }
      : undefined;

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
      ...(extraQueryParams ? { extraQueryParams } : {}),
      userStore: new WebStorageStateStore({ store: window.localStorage }),
    });

    this.instances.set(authConfig.authority, manager);
    return manager;
  }
}
