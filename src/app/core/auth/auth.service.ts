import { Injectable, inject } from '@angular/core';
import type { User } from 'oidc-client-ts';
import { AuthConfig } from '../config/app-config.model';
import { OidcUserManagerFactory } from './oidc-user-manager.factory';

const AUTH_PROVIDER_PAUSE_KEY_PREFIX = 'daybook.auth.provider-paused.';
const AUTH_LOGIN_ERROR_KEY_PREFIX = 'daybook.auth.login-error.';
const AUTH_RETURN_URI_KEY_PREFIX = 'daybook.auth.return-uri.';
const DEFAULT_POST_LOGIN_RETURN_PATH = '/handle-login-return';
const DEFAULT_POST_LOGIN_ROUTE = '/app/dashboard';

type OidcErrorResponseLike = Error & {
  error?: string;
  error_description?: string | null;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oidcUserManagerFactory = inject(OidcUserManagerFactory);

  async hasActiveSession(authConfig: AuthConfig): Promise<boolean> {
    const manager = this.oidcUserManagerFactory.create(authConfig);
    const user = await manager.getUser();
    return Boolean(user && !user.expired);
  }

  async getAccessToken(authConfig: AuthConfig): Promise<string | null> {
    const manager = this.oidcUserManagerFactory.create(authConfig);
    const user = await manager.getUser();
    return user && !user.expired ? user.access_token : null;
  }

  isLoginCallbackRoute(authConfig: AuthConfig): boolean {
    return this.isConfiguredRedirectPath(authConfig) || this.hasOidcCallbackParams();
  }

  isCurrentLoginCallbackUrl(): boolean {
    return (
      this.hasOidcCallbackParams() ||
      this.normalizePath(window.location.pathname) === '/auth/callback'
    );
  }

  isPostLoginReturnRoute(authConfig: AuthConfig): boolean {
    const postLoginRedirect = authConfig.postLoginRedirect;

    if (postLoginRedirect && this.matchesPath(postLoginRedirect)) {
      return true;
    }

    return window.location.pathname === DEFAULT_POST_LOGIN_RETURN_PATH;
  }

  isAuthServerRoute(): boolean {
    const path = this.normalizePath(window.location.pathname);
    const queryParams = new URLSearchParams(window.location.search);

    return (
      (path === '/login' && queryParams.has('login_challenge')) ||
      (path === DEFAULT_POST_LOGIN_RETURN_PATH && queryParams.has('login_challenge'))
    );
  }

  isOutsideClientRedirectOrigin(authConfig: AuthConfig): boolean {
    return window.location.origin !== new URL(authConfig.redirectUri).origin;
  }

  isAuthServerOrigin(authConfig: AuthConfig): boolean {
    const postLoginRedirect = authConfig.postLoginRedirect;

    if (postLoginRedirect && window.location.origin === new URL(postLoginRedirect).origin) {
      return true;
    }

    return window.location.hostname.startsWith('auth-');
  }

  async completeLogin(authConfig: AuthConfig): Promise<User> {
    const manager = this.oidcUserManagerFactory.create(authConfig);
    const user = await manager.signinRedirectCallback();
    this.clearLoginCallbackUrl();
    this.clearPausedProvider(authConfig);
    this.clearLoginError(authConfig);
    return user;
  }

  async startLogin(authConfig: AuthConfig): Promise<void> {
    const manager = this.oidcUserManagerFactory.create(authConfig);
    this.rememberReturnUri(authConfig);
    await manager.signinRedirect();
  }

  async startLogout(authConfig: AuthConfig): Promise<void> {
    const manager = this.oidcUserManagerFactory.create(authConfig);
    const user = await manager.getUser();
    await manager.removeUser();
    await manager.signoutRedirect({
      id_token_hint: user?.id_token,
    });
  }

  getPausedProviderMessage(authConfig: AuthConfig): string | null {
    return sessionStorage.getItem(this.getPausedProviderKey(authConfig));
  }

  pauseProvider(authConfig: AuthConfig, message?: string): string {
    const warningMessage =
      message ??
      'Authentication is temporarily unavailable. Hydra discovery is paused until the service is back.';
    sessionStorage.setItem(this.getPausedProviderKey(authConfig), warningMessage);
    return warningMessage;
  }

  clearPausedProvider(authConfig: AuthConfig): void {
    sessionStorage.removeItem(this.getPausedProviderKey(authConfig));
  }

  getLoginErrorMessage(authConfig: AuthConfig): string | null {
    return sessionStorage.getItem(this.getLoginErrorKey(authConfig));
  }

  rememberLoginError(authConfig: AuthConfig, message: string): string {
    sessionStorage.setItem(this.getLoginErrorKey(authConfig), message);
    return message;
  }

  clearLoginError(authConfig: AuthConfig): void {
    sessionStorage.removeItem(this.getLoginErrorKey(authConfig));
  }

  consumeReturnUri(authConfig: AuthConfig): string {
    const returnUri = localStorage.getItem(this.getReturnUriKey(authConfig));
    localStorage.removeItem(this.getReturnUriKey(authConfig));
    return this.normalizeReturnUri(returnUri) ?? DEFAULT_POST_LOGIN_ROUTE;
  }

  rememberReturnUri(
    authConfig: AuthConfig,
    returnUri = `${window.location.pathname}${window.location.search}`,
  ): void {
    const normalizedReturnUri = this.normalizeReturnUri(returnUri);

    if (normalizedReturnUri) {
      localStorage.setItem(this.getReturnUriKey(authConfig), normalizedReturnUri);
    }
  }

  async clearStaleLoginState(authConfig: AuthConfig): Promise<void> {
    const manager = this.oidcUserManagerFactory.create(authConfig);
    try {
      await manager.clearStaleState();
    } catch {
      // Best-effort cleanup should never hide the login error shown to the user.
    }
  }

  clearLoginCallbackUrl(): void {
    window.history.replaceState(window.history.state, document.title, '/');
  }

  isProviderAvailabilityError(error: unknown): boolean {
    const message =
      error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    return [
      'failed to fetch',
      'network',
      'load failed',
      'timed out',
      'timeout',
      'openid-configuration',
      'jwks',
      '503',
      '502',
      '504',
      'service unavailable',
      'bad gateway',
      'gateway timeout',
    ].some((token) => message.includes(token));
  }

  buildProviderUnavailableMessage(): string {
    return 'Authentication is temporarily unavailable. Hydra lookups are paused for now. Try signing in again once the service is back.';
  }

  buildLoginErrorMessage(error: unknown): string {
    if (this.isOidcErrorResponse(error)) {
      return error.error_description || error.message || `Login failed: ${error.error}`;
    }

    return error instanceof Error ? error.message : 'Login failed. Please try signing in again.';
  }

  buildIncompleteLoginReturnMessage(): string {
    return 'The sign-in page returned without an authorization response. Please try signing in again.';
  }

  buildAuthServerRouteMessage(): string {
    return 'The auth return page was loaded by the client app. The auth server must complete the Hydra login challenge before returning here.';
  }

  private isOidcErrorResponse(error: unknown): error is OidcErrorResponseLike {
    return error instanceof Error && 'error' in error;
  }

  private isConfiguredRedirectPath(authConfig: AuthConfig): boolean {
    return this.matchesPath(authConfig.redirectUri);
  }

  private matchesPath(urlOrPath: string): boolean {
    const path = urlOrPath.startsWith('/') ? urlOrPath : new URL(urlOrPath).pathname;
    return this.normalizePath(window.location.pathname) === this.normalizePath(path);
  }

  private hasOidcCallbackParams(): boolean {
    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '',
    );

    return this.hasOidcResponse(queryParams) || this.hasOidcResponse(hashParams);
  }

  private hasOidcResponse(params: URLSearchParams): boolean {
    return params.has('state') && (params.has('code') || params.has('error'));
  }

  private normalizePath(path: string): string {
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  }

  private getPausedProviderKey(authConfig: AuthConfig): string {
    return `${AUTH_PROVIDER_PAUSE_KEY_PREFIX}${authConfig.authority}`;
  }

  private getLoginErrorKey(authConfig: AuthConfig): string {
    return `${AUTH_LOGIN_ERROR_KEY_PREFIX}${authConfig.authority}`;
  }

  private getReturnUriKey(authConfig: AuthConfig): string {
    return `${AUTH_RETURN_URI_KEY_PREFIX}${authConfig.authority}`;
  }

  private normalizeReturnUri(returnUri: string | null): string | null {
    if (!returnUri || !returnUri.startsWith('/')) {
      return null;
    }

    const path = this.normalizePath(returnUri.split('?')[0] ?? returnUri);

    if (path === '/' || path === '/auth/callback' || path.startsWith('/auth/')) {
      return null;
    }

    if (!path.startsWith('/app/') && !path.startsWith('/bootstrap/')) {
      return null;
    }

    return returnUri;
  }
}
