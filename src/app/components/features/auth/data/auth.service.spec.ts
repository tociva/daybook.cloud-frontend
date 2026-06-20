import { TestBed } from '@angular/core/testing';
import type { User, UserManager } from 'oidc-client-ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthConfig } from '../../../../core/config/app-config.model';
import { AuthService } from './auth.service';
import { OidcUserManagerFactory } from './oidc-user-manager.factory';

const authConfig: AuthConfig = {
  audience: 'daybook.cloud-users',
  authority: 'https://hydra.example.test/',
  clientId: 'daybook-user-client',
  postLoginRedirect: null,
  postLogoutRedirect: 'https://app.example.test/auth/logout',
  redirectUri: 'https://app.example.test/auth/callback',
  scope: 'openid profile email offline_access',
};

type UserManagerMock = Readonly<{
  getUser: ReturnType<typeof vi.fn>;
  signinSilent: ReturnType<typeof vi.fn>;
}>;

function createUser(overrides: Partial<User> = {}): User {
  return {
    access_token: 'access-token',
    expired: false,
    expires_in: 300,
    id_token: 'id-token',
    profile: { sub: 'user-1' },
    refresh_token: 'refresh-token',
    scope: 'openid profile email offline_access',
    session_state: null,
    token_type: 'Bearer',
    ...overrides,
  } as User;
}

function createManager(
  user: User | null,
  renewedUser: User | null = createUser(),
): UserManagerMock {
  return {
    getUser: vi.fn(async () => user),
    signinSilent: vi.fn(async () => renewedUser),
  };
}

function configure(manager: UserManagerMock): AuthService {
  TestBed.configureTestingModule({
    providers: [
      AuthService,
      {
        provide: OidcUserManagerFactory,
        useValue: {
          create: vi.fn(() => manager as unknown as UserManager),
        },
      },
    ],
  });

  return TestBed.inject(AuthService);
}

describe('AuthService refresh-token renewal', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('returns the current token when it is outside the renewal window', async () => {
    const manager = createManager(createUser({ access_token: 'current-token', expires_in: 300 }));
    const service = configure(manager);

    await expect(service.getAccessToken(authConfig)).resolves.toBe('current-token');

    expect(manager.signinSilent).not.toHaveBeenCalled();
  });

  it('renews a near-expiry token with the stored refresh token', async () => {
    const manager = createManager(
      createUser({ access_token: 'old-token', expires_in: 30 }),
      createUser({ access_token: 'renewed-token', refresh_token: 'rotated-refresh-token' }),
    );
    const service = configure(manager);

    await expect(service.getAccessToken(authConfig)).resolves.toBe('renewed-token');

    expect(manager.signinSilent).toHaveBeenCalledOnce();
  });

  it('renews an expired token before returning an access token', async () => {
    const manager = createManager(
      createUser({ access_token: 'old-token', expired: true, expires_in: -1 }),
      createUser({ access_token: 'renewed-token' }),
    );
    const service = configure(manager);

    await expect(service.getAccessToken(authConfig)).resolves.toBe('renewed-token');

    expect(manager.signinSilent).toHaveBeenCalledOnce();
  });

  it('does not use iframe fallback when no refresh token is stored', async () => {
    const manager = createManager(
      createUser({ expired: true, expires_in: -1, refresh_token: undefined }),
    );
    const service = configure(manager);

    await expect(service.getAccessToken(authConfig)).resolves.toBeNull();

    expect(manager.signinSilent).not.toHaveBeenCalled();
  });

  it('shares concurrent refresh attempts', async () => {
    const renewedUser = createUser({ access_token: 'renewed-token' });
    let resolveRenewal: (user: User) => void = () => undefined;
    const manager = createManager(createUser({ expires_in: 10 }));
    manager.signinSilent.mockReturnValue(
      new Promise<User>((resolve) => {
        resolveRenewal = resolve;
      }),
    );
    const service = configure(manager);

    const firstRenewal = service.renewWithRefreshTokenOnce(authConfig);
    const secondRenewal = service.renewWithRefreshTokenOnce(authConfig);
    await Promise.resolve();

    expect(manager.signinSilent).toHaveBeenCalledOnce();

    resolveRenewal(renewedUser);

    await expect(Promise.all([firstRenewal, secondRenewal])).resolves.toEqual([
      renewedUser,
      renewedUser,
    ]);
  });
});
