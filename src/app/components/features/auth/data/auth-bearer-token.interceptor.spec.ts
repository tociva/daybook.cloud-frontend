import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { User } from 'oidc-client-ts';
import { firstValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../../../../core/config/app-config.model';
import { AppConfigStore } from '../../../../core/config/app-config.store';
import { authBearerTokenInterceptor } from './auth-bearer-token.interceptor';
import { AuthService } from './auth.service';

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

type AuthServiceMock = Readonly<{
  getAccessToken: ReturnType<typeof vi.fn>;
  renewWithRefreshTokenOnce: ReturnType<typeof vi.fn>;
  startLogin: ReturnType<typeof vi.fn>;
}>;

function createUser(accessToken: string): User {
  return {
    access_token: accessToken,
    expired: false,
    expires_in: 300,
    profile: { sub: 'user-1' },
    refresh_token: 'rotated-refresh-token',
    session_state: null,
    token_type: 'Bearer',
  } as User;
}

function configure(authService: AuthServiceMock): void {
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: authService },
      {
        provide: AppConfigStore,
        useValue: {
          config: signal(appConfig),
          load: vi.fn(),
        },
      },
    ],
  });
}

function runInterceptor(request: HttpRequest<unknown>, handler: HttpHandlerFn) {
  return TestBed.runInInjectionContext(() =>
    firstValueFrom(authBearerTokenInterceptor(request, handler)),
  );
}

describe('authBearerTokenInterceptor refresh-token retry', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('retries a 401 request with a refreshed bearer token', async () => {
    const authService: AuthServiceMock = {
      getAccessToken: vi.fn(async () => 'old-token'),
      renewWithRefreshTokenOnce: vi.fn(async () => createUser('new-token')),
      startLogin: vi.fn(),
    };
    configure(authService);

    const request = new HttpRequest('GET', `${appConfig.apiBaseUrl}/items`);
    const handler = vi.fn((outgoing: HttpRequest<unknown>) => {
      if (handler.mock.calls.length === 1) {
        expect(outgoing.headers.get('Authorization')).toBe('Bearer old-token');
        return throwError(
          () => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }),
        );
      }

      expect(outgoing.headers.get('Authorization')).toBe('Bearer new-token');
      expect(outgoing.headers.get('X-Auth-Retry')).toBe('1');
      return of(new HttpResponse({ body: { ok: true }, status: 200 }));
    });

    await expect(runInterceptor(request, handler)).resolves.toEqual(
      expect.objectContaining({ body: { ok: true }, status: 200 }),
    );
    expect(authService.renewWithRefreshTokenOnce).toHaveBeenCalledOnce();
    expect(authService.startLogin).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('starts the login fallback once when refresh-token renewal fails', async () => {
    const authService: AuthServiceMock = {
      getAccessToken: vi.fn(async () => 'old-token'),
      renewWithRefreshTokenOnce: vi.fn(async () => null),
      startLogin: vi.fn(async () => {
        throw new Error('redirect unavailable in test');
      }),
    };
    configure(authService);

    const request = new HttpRequest('GET', `${appConfig.apiBaseUrl}/items`);
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    const handler = vi.fn(() => throwError(() => error));

    await expect(runInterceptor(request, handler)).rejects.toBe(error);

    expect(authService.renewWithRefreshTokenOnce).toHaveBeenCalledOnce();
    expect(authService.startLogin).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledOnce();
  });
});
