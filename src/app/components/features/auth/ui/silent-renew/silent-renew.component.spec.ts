import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../../../../../core/config/app-config.model';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import { AuthService } from '../../data/auth.service';
import { SilentRenewComponent } from './silent-renew.component';

const appConfig: AppConfig = {
  apiBaseUrl: 'https://api.example.test/api/v1',
  auth: {
    authority: 'https://hydra.example.test/',
    audience: 'daybook.cloud-users',
    clientId: 'daybook-user-client',
    postLoginRedirect: null,
    postLogoutRedirect: 'https://app.example.test/auth/logout',
    redirectUri: 'https://app.example.test/auth/callback',
    scope: 'openid profile email offline_access',
  },
};

type AuthServiceMock = Readonly<{
  completeSilentRenew: ReturnType<typeof vi.fn>;
}>;

type AppConfigStoreMock = Readonly<{
  config: ReturnType<typeof signal<AppConfig | null>>;
  load: ReturnType<typeof vi.fn>;
}>;

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    TestBed.flushEffects();
    await Promise.resolve();
  }
}

describe('SilentRenewComponent', () => {
  let authService: AuthServiceMock;
  let appConfigStore: AppConfigStoreMock;

  function configure(initialConfig: AppConfig | null, loadResult: AppConfig | null = appConfig): void {
    const config = signal<AppConfig | null>(initialConfig);

    authService = {
      completeSilentRenew: vi.fn(async () => undefined),
    };
    appConfigStore = {
      config,
      load: vi.fn(async () => {
        config.set(loadResult);
        return loadResult;
      }),
    };

    TestBed.configureTestingModule({
      imports: [SilentRenewComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AppConfigStore, useValue: appConfigStore },
      ],
    });
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('completes silent renew with the already loaded auth config', async () => {
    configure(appConfig);

    TestBed.createComponent(SilentRenewComponent);
    await settle();

    expect(appConfigStore.load).not.toHaveBeenCalled();
    expect(authService.completeSilentRenew).toHaveBeenCalledOnce();
    expect(authService.completeSilentRenew).toHaveBeenCalledWith(appConfig.auth);
  });

  it('loads config before completing silent renew when config is missing', async () => {
    configure(null);

    TestBed.createComponent(SilentRenewComponent);
    await settle();

    expect(appConfigStore.load).toHaveBeenCalledOnce();
    expect(authService.completeSilentRenew).toHaveBeenCalledOnce();
    expect(authService.completeSilentRenew).toHaveBeenCalledWith(appConfig.auth);
  });

  it('does not complete silent renew when config cannot be loaded', async () => {
    configure(null, null);

    TestBed.createComponent(SilentRenewComponent);
    await settle();

    expect(appConfigStore.load).toHaveBeenCalledOnce();
    expect(authService.completeSilentRenew).not.toHaveBeenCalled();
  });

  it('handles the silent renew callback only once across reactive reruns', async () => {
    configure(appConfig);

    TestBed.createComponent(SilentRenewComponent);
    await settle();

    appConfigStore.config.set({
      ...appConfig,
      auth: {
        ...appConfig.auth,
        clientId: 'another-client',
      },
    });
    await settle();

    expect(authService.completeSilentRenew).toHaveBeenCalledOnce();
    expect(authService.completeSilentRenew).toHaveBeenCalledWith(appConfig.auth);
  });
});
