import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import type { AppConfig } from '../../../../../core/config/app-config.model';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import type { TaxReportResponse } from './tax-report.model';
import { TaxReportService } from './tax-report.service';

const appConfig: AppConfig = {
  apiBaseUrl: 'https://api.example.com/',
  auth: {
    audience: null,
    authority: 'https://auth.example.com',
    clientId: 'client-id',
    postLoginRedirect: null,
    postLogoutRedirect: '/auth/logout',
    redirectUri: '/auth/callback',
    scope: 'openid profile email',
  },
};

const response: TaxReportResponse = {
  title: 'Tax Report for Main Branch between 2024-04-01 and 2025-04-30',
  generatedAt: '2026-06-29T18:45:10+05:30',
  data: [{ month: 'April', year: 2024, taxes: {} }],
};

describe('TaxReportService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads the tax report with start and end query parameters', async () => {
    const get = vi.fn(async () => response);

    TestBed.configureTestingModule({
      providers: [
        TaxReportService,
        { provide: ApiClientService, useValue: { get } },
        {
          provide: AppConfigStore,
          useValue: { config: signal(appConfig), load: vi.fn() },
        },
      ],
    });

    const query = { start: '2024-04-01', end: '2025-04-30' };
    await expect(TestBed.inject(TaxReportService).getTaxReport(query)).resolves.toBe(response);
    expect(get).toHaveBeenCalledWith('https://api.example.com/accounting/accounting-report/tax', {
      params: expect.objectContaining({
        updates: expect.arrayContaining([
          { param: 'start', value: '2024-04-01', op: 's' },
          { param: 'end', value: '2025-04-30', op: 's' },
        ]),
      }),
    });
  });
});
