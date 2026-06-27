import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { User } from 'oidc-client-ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../components/features/auth/data/auth.service';
import { AuthStore } from '../../components/features/auth/data/auth.store';
import {
  OrganizationMemberStatus,
  UserRoles,
} from '../../components/features/management/data/organization-member/organization-member.enums';
import type { UserSession } from '../../components/features/management/data/user-session/user-session.model';
import { UserSessionService } from '../../components/features/management/data/user-session/user-session.service';
import { UserSessionStore } from '../../components/features/management/data/user-session/user-session.store';
import { CatalogCacheCoordinatorService } from '../cache/catalog-cache-coordinator.service';
import type { AppConfig } from '../config/app-config.model';
import { AppConfigStore } from '../config/app-config.store';
import { LedgerCachePreferencesStore } from '../preferences/ledger-cache-preferences.store';
import { AppThemeStore } from '../theme/app-theme.store';
import { AppSystemStore } from './app-system.store';

const appConfig: AppConfig = {
  apiBaseUrl: 'https://api.example.test/api/v1',
  auth: {
    audience: 'daybook.cloud-users',
    authority: 'https://hydra.example.test/',
    clientId: 'daybook-user-client',
    postLoginRedirect: null,
    postLogoutRedirect: 'https://app.example.test/auth/logout',
    redirectUri: 'https://app.example.test/auth/callback',
    scope: 'openid profile email offline_access',
  },
};

const userSession = {
  email: 'user@example.test',
  member: null,
  memberorgs: [],
  name: 'Test User',
  ownorgs: [{ id: 'org-1', name: 'Org 1' }],
  userid: 'user-1',
} as unknown as UserSession;

const renewedUser = {
  access_token: 'renewed-access-token',
  expired: false,
  expires_in: 300,
  profile: { sub: 'user-1' },
  refresh_token: 'rotated-refresh-token',
  session_state: null,
  token_type: 'Bearer',
} as User;

describe('AppSystemStore refresh-token session recovery', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('uses refresh-token renewal before retrying an unauthorized user-session load', async () => {
    const createUserSession = vi
      .fn()
      .mockRejectedValueOnce(new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
      .mockResolvedValueOnce(userSession);
    const renewWithRefreshTokenOnce = vi.fn(async () => renewedUser);
    const navigateByUrl = vi.fn(async () => true);

    TestBed.configureTestingModule({
      providers: [
        AppSystemStore,
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: AppConfigStore,
          useValue: {
            config: vi.fn(() => appConfig),
            load: vi.fn(async () => appConfig),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            resetSessionState: vi.fn(),
            setSessionState: vi.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            clearPausedProvider: vi.fn(),
            consumeReturnUri: vi.fn(() => '/app/dashboard'),
            getCurrentReturnUri: vi.fn(() => '/app/dashboard'),
            getLoginErrorMessage: vi.fn(() => null),
            getPausedProviderMessage: vi.fn(() => null),
            hasActiveSession: vi.fn(async () => true),
            isAuthServerOrigin: vi.fn(() => false),
            isAuthServerRoute: vi.fn(() => false),
            isLoginCallbackRoute: vi.fn(() => false),
            isOutsideClientRedirectOrigin: vi.fn(() => false),
            isPostLoginReturnRoute: vi.fn(() => false),
            isPostLogoutRedirectRoute: vi.fn(() => false),
            renewWithRefreshTokenOnce,
            startLogin: vi.fn(),
          },
        },
        {
          provide: UserSessionService,
          useValue: { createUserSession },
        },
        {
          provide: UserSessionStore,
          useValue: {
            resetSession: vi.fn(),
            setError: vi.fn(),
            setLoading: vi.fn(),
            setSession: vi.fn(),
          },
        },
        { provide: AppThemeStore, useValue: { initFromSession: vi.fn() } },
        { provide: LedgerCachePreferencesStore, useValue: { initFromSession: vi.fn() } },
        {
          provide: CatalogCacheCoordinatorService,
          useValue: { clearAllPersistedCatalogsForUser: vi.fn() },
        },
      ],
    });

    const store = TestBed.inject(AppSystemStore);
    await store.initialize();

    expect(createUserSession).toHaveBeenCalledTimes(2);
    expect(renewWithRefreshTokenOnce).toHaveBeenCalledOnce();
    expect(renewWithRefreshTokenOnce).toHaveBeenCalledWith(appConfig.auth);
    expect(navigateByUrl).toHaveBeenCalledWith('/app/dashboard');
    expect(store.startupStatus()).toBe('user-session-ready');
  });

  it('routes pending-invite-only sessions to bootstrap', async () => {
    const pendingInviteSession = {
      ...userSession,
      member: null,
      memberorgs: [
        {
          organization: { id: 'org-2', name: 'Invited Org' },
          organizationid: 'org-2',
          role: UserRoles.USER,
          status: OrganizationMemberStatus.INVITED,
          userid: 'user-1',
        },
      ],
      organization: null,
      ownorgs: [],
    } as unknown as UserSession;
    const createUserSession = vi.fn().mockResolvedValue(pendingInviteSession);
    const navigateByUrl = vi.fn(async () => true);

    TestBed.configureTestingModule({
      providers: [
        AppSystemStore,
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: AppConfigStore,
          useValue: {
            config: vi.fn(() => appConfig),
            load: vi.fn(async () => appConfig),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            resetSessionState: vi.fn(),
            setSessionState: vi.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            clearPausedProvider: vi.fn(),
            consumeReturnUri: vi.fn(() => '/app/dashboard'),
            getCurrentReturnUri: vi.fn(() => '/app/dashboard'),
            getLoginErrorMessage: vi.fn(() => null),
            getPausedProviderMessage: vi.fn(() => null),
            hasActiveSession: vi.fn(async () => true),
            isAuthServerOrigin: vi.fn(() => false),
            isAuthServerRoute: vi.fn(() => false),
            isLoginCallbackRoute: vi.fn(() => false),
            isOutsideClientRedirectOrigin: vi.fn(() => false),
            isPostLoginReturnRoute: vi.fn(() => false),
            isPostLogoutRedirectRoute: vi.fn(() => false),
            renewWithRefreshTokenOnce: vi.fn(),
            startLogin: vi.fn(),
          },
        },
        {
          provide: UserSessionService,
          useValue: { createUserSession },
        },
        {
          provide: UserSessionStore,
          useValue: {
            resetSession: vi.fn(),
            setError: vi.fn(),
            setLoading: vi.fn(),
            setSession: vi.fn(),
          },
        },
        { provide: AppThemeStore, useValue: { initFromSession: vi.fn() } },
        { provide: LedgerCachePreferencesStore, useValue: { initFromSession: vi.fn() } },
        {
          provide: CatalogCacheCoordinatorService,
          useValue: { clearAllPersistedCatalogsForUser: vi.fn() },
        },
      ],
    });

    const store = TestBed.inject(AppSystemStore);
    await store.initialize();

    expect(navigateByUrl).toHaveBeenCalledWith('/bootstrap/bootstrap-organization');
    expect(store.startupStatus()).toBe('user-session-ready');
  });

  it('routes invited-organization-only sessions to organization selection', async () => {
    const invitedOrganizationSession = {
      ...userSession,
      invitedorgs: [
        {
          id: 'invite-1',
          organization: { id: 'org-2', name: 'Invited Org' },
          organizationid: 'org-2',
          role: UserRoles.USER,
          status: OrganizationMemberStatus.INVITED,
        },
      ],
      member: null,
      memberorgs: [],
      organization: null,
      ownorgs: [],
    } as unknown as UserSession;
    const createUserSession = vi.fn().mockResolvedValue(invitedOrganizationSession);
    const navigateByUrl = vi.fn(async () => true);

    TestBed.configureTestingModule({
      providers: [
        AppSystemStore,
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: AppConfigStore,
          useValue: {
            config: vi.fn(() => appConfig),
            load: vi.fn(async () => appConfig),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            resetSessionState: vi.fn(),
            setSessionState: vi.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            clearPausedProvider: vi.fn(),
            consumeReturnUri: vi.fn(() => '/app/dashboard'),
            getCurrentReturnUri: vi.fn(() => '/app/dashboard'),
            getLoginErrorMessage: vi.fn(() => null),
            getPausedProviderMessage: vi.fn(() => null),
            hasActiveSession: vi.fn(async () => true),
            isAuthServerOrigin: vi.fn(() => false),
            isAuthServerRoute: vi.fn(() => false),
            isLoginCallbackRoute: vi.fn(() => false),
            isOutsideClientRedirectOrigin: vi.fn(() => false),
            isPostLoginReturnRoute: vi.fn(() => false),
            isPostLogoutRedirectRoute: vi.fn(() => false),
            renewWithRefreshTokenOnce: vi.fn(),
            startLogin: vi.fn(),
          },
        },
        {
          provide: UserSessionService,
          useValue: { createUserSession },
        },
        {
          provide: UserSessionStore,
          useValue: {
            resetSession: vi.fn(),
            setError: vi.fn(),
            setLoading: vi.fn(),
            setSession: vi.fn(),
          },
        },
        { provide: AppThemeStore, useValue: { initFromSession: vi.fn() } },
        { provide: LedgerCachePreferencesStore, useValue: { initFromSession: vi.fn() } },
        {
          provide: CatalogCacheCoordinatorService,
          useValue: { clearAllPersistedCatalogsForUser: vi.fn() },
        },
      ],
    });

    const store = TestBed.inject(AppSystemStore);
    await store.initialize();

    expect(navigateByUrl).toHaveBeenCalledWith('/app/select-organization');
    expect(store.startupStatus()).toBe('user-session-ready');
  });

  it('routes accepted member-only sessions without an active organization to organization selection', async () => {
    const acceptedMemberSession = {
      ...userSession,
      member: null,
      memberorgs: [
        {
          organization: { id: 'org-2', name: 'Accepted Org' },
          organizationid: 'org-2',
          role: UserRoles.USER,
          status: OrganizationMemberStatus.ACCEPTED,
          userid: 'user-1',
        },
      ],
      organization: null,
      ownorgs: [],
    } as unknown as UserSession;
    const createUserSession = vi.fn().mockResolvedValue(acceptedMemberSession);
    const navigateByUrl = vi.fn(async () => true);

    TestBed.configureTestingModule({
      providers: [
        AppSystemStore,
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: AppConfigStore,
          useValue: {
            config: vi.fn(() => appConfig),
            load: vi.fn(async () => appConfig),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            resetSessionState: vi.fn(),
            setSessionState: vi.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            clearPausedProvider: vi.fn(),
            consumeReturnUri: vi.fn(() => '/app/dashboard'),
            getCurrentReturnUri: vi.fn(() => '/app/dashboard'),
            getLoginErrorMessage: vi.fn(() => null),
            getPausedProviderMessage: vi.fn(() => null),
            hasActiveSession: vi.fn(async () => true),
            isAuthServerOrigin: vi.fn(() => false),
            isAuthServerRoute: vi.fn(() => false),
            isLoginCallbackRoute: vi.fn(() => false),
            isOutsideClientRedirectOrigin: vi.fn(() => false),
            isPostLoginReturnRoute: vi.fn(() => false),
            isPostLogoutRedirectRoute: vi.fn(() => false),
            renewWithRefreshTokenOnce: vi.fn(),
            startLogin: vi.fn(),
          },
        },
        {
          provide: UserSessionService,
          useValue: { createUserSession },
        },
        {
          provide: UserSessionStore,
          useValue: {
            resetSession: vi.fn(),
            setError: vi.fn(),
            setLoading: vi.fn(),
            setSession: vi.fn(),
          },
        },
        { provide: AppThemeStore, useValue: { initFromSession: vi.fn() } },
        { provide: LedgerCachePreferencesStore, useValue: { initFromSession: vi.fn() } },
        {
          provide: CatalogCacheCoordinatorService,
          useValue: { clearAllPersistedCatalogsForUser: vi.fn() },
        },
      ],
    });

    const store = TestBed.inject(AppSystemStore);
    await store.initialize();

    expect(navigateByUrl).toHaveBeenCalledWith('/app/select-organization');
    expect(store.startupStatus()).toBe('user-session-ready');
  });

  it('moves to the local logout route before clearing session data and starting provider logout', async () => {
    const callOrder: string[] = [];
    const navigateByUrl = vi.fn(async () => {
      callOrder.push('navigate');
      return true;
    });
    const clearAllPersistedCatalogsForUser = vi.fn(async () => {
      callOrder.push('clear-catalogs');
    });
    const clearUserSession = vi.fn(async () => {
      callOrder.push('clear-session');
    });
    const startLogout = vi.fn(async () => {
      callOrder.push('start-logout');
    });

    TestBed.configureTestingModule({
      providers: [
        AppSystemStore,
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: AppConfigStore,
          useValue: {
            config: vi.fn(() => appConfig),
            load: vi.fn(async () => appConfig),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            resetSessionState: vi.fn(),
            setSessionState: vi.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            startLogout,
          },
        },
        {
          provide: UserSessionService,
          useValue: { clearUserSession },
        },
        {
          provide: UserSessionStore,
          useValue: {
            resetSession: vi.fn(),
            setError: vi.fn(),
            setLoading: vi.fn(),
            setSession: vi.fn(),
          },
        },
        { provide: AppThemeStore, useValue: { initFromSession: vi.fn() } },
        { provide: LedgerCachePreferencesStore, useValue: { initFromSession: vi.fn() } },
        {
          provide: CatalogCacheCoordinatorService,
          useValue: { clearAllPersistedCatalogsForUser },
        },
      ],
    });

    const store = TestBed.inject(AppSystemStore);
    await store.logout();

    expect(navigateByUrl).toHaveBeenCalledWith('/auth/logout', { replaceUrl: true });
    expect(clearUserSession).toHaveBeenCalledWith(appConfig.apiBaseUrl);
    expect(startLogout).toHaveBeenCalledWith(appConfig.auth);
    expect(callOrder).toEqual(['navigate', 'clear-catalogs', 'clear-session', 'start-logout']);
    expect(store.startupStatus()).toBe('logging-out');
  });

  it('keeps logout failures on the local logout route', async () => {
    const navigateByUrl = vi.fn(async () => true);
    const startLogout = vi.fn(async () => {
      throw new Error('Provider logout failed');
    });

    TestBed.configureTestingModule({
      providers: [
        AppSystemStore,
        { provide: Router, useValue: { navigateByUrl } },
        {
          provide: AppConfigStore,
          useValue: {
            config: vi.fn(() => appConfig),
            load: vi.fn(async () => appConfig),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            resetSessionState: vi.fn(),
            setSessionState: vi.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            startLogout,
          },
        },
        {
          provide: UserSessionService,
          useValue: { clearUserSession: vi.fn(async () => undefined) },
        },
        {
          provide: UserSessionStore,
          useValue: {
            resetSession: vi.fn(),
            setError: vi.fn(),
            setLoading: vi.fn(),
            setSession: vi.fn(),
          },
        },
        { provide: AppThemeStore, useValue: { initFromSession: vi.fn() } },
        { provide: LedgerCachePreferencesStore, useValue: { initFromSession: vi.fn() } },
        {
          provide: CatalogCacheCoordinatorService,
          useValue: { clearAllPersistedCatalogsForUser: vi.fn(async () => undefined) },
        },
      ],
    });

    const store = TestBed.inject(AppSystemStore);
    await store.logout();

    expect(navigateByUrl).toHaveBeenCalledWith('/auth/logout', { replaceUrl: true });
    expect(store.startupStatus()).toBe('logout-error');
    expect(store.error()).toBe('Provider logout failed');
  });
});
