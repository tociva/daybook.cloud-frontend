import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientService } from '../../core/api/api-client.service';
import type { AppConfig } from '../../core/config/app-config.model';
import { AppConfigStore } from '../../core/config/app-config.store';
import {
  SignedUrlDownloadService,
  type SignedDownloadUrlResponse,
} from './signed-url-download.service';

const appConfig: AppConfig = {
  apiBaseUrl: 'https://api.example.test/',
  auth: {
    audience: null,
    authority: 'https://auth.example.test',
    clientId: 'client-id',
    postLoginRedirect: null,
    postLogoutRedirect: '/auth/logout',
    redirectUri: '/auth/callback',
    scope: 'openid profile email',
  },
};

describe('SignedUrlDownloadService', () => {
  const apiGet = vi.fn();

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        SignedUrlDownloadService,
        { provide: ApiClientService, useValue: { get: apiGet } },
        {
          provide: AppConfigStore,
          useValue: { config: signal(appConfig), load: vi.fn() },
        },
      ],
    });
  });

  it('requests the authenticated API endpoint and returns the exact signed URL response', async () => {
    apiGet.mockResolvedValue({ getUrl: '  https://s3.example.test/file  ', expiresIn: 3600 });

    const service = TestBed.inject(SignedUrlDownloadService);

    await expect(service.get('/storage/stored-document/doc-1/download-url')).resolves.toEqual({
      getUrl: 'https://s3.example.test/file',
      expiresIn: 3600,
    });
    expect(apiGet).toHaveBeenCalledWith(
      'https://api.example.test/storage/stored-document/doc-1/download-url',
    );
  });

  it('preserves additional document metadata returned by the logo endpoint', async () => {
    apiGet.mockResolvedValue({
      id: 'logo-1',
      name: 'logo.svg',
      size: 128,
      getUrl: 'https://s3.example.test/logo',
      expiresIn: 3600,
    });

    const service = TestBed.inject(SignedUrlDownloadService);
    const result = await service.get<
      SignedDownloadUrlResponse & Readonly<{ id: string; name: string; size: number }>
    >('/organization/organization/org-1/logo/normal/url');

    expect(result).toEqual({
      id: 'logo-1',
      name: 'logo.svg',
      size: 128,
      getUrl: 'https://s3.example.test/logo',
      expiresIn: 3600,
    });
  });

  it.each([
    null,
    {},
    { getUrl: '', expiresIn: 3600 },
    { getUrl: 'https://s3.example.test/file' },
  ])('rejects an invalid signed URL response: %j', async (response) => {
    apiGet.mockResolvedValue(response);

    const service = TestBed.inject(SignedUrlDownloadService);

    await expect(service.get('/download-url')).rejects.toThrow(/Download URL/);
  });
});
