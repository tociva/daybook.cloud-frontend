import type { HttpParams } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientService } from '../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../core/config/app-config.store';
import type { AppConfig } from '../../../../core/config/app-config.model';
import type { AccountantDashboardSummary } from './accountant-dashboard.model';
import { AccountantDashboardService } from './accountant-dashboard.service';

const config = (apiBaseUrl: string): AppConfig => ({
  apiBaseUrl,
  auth: {
    audience: null,
    authority: 'https://auth.example.com',
    clientId: 'client-id',
    postLoginRedirect: null,
    postLogoutRedirect: '/auth/logout',
    redirectUri: '/auth/callback',
    scope: 'openid profile email',
  },
});

const summary: AccountantDashboardSummary = {
  asOfDate: '2026-06-19',
  branchid: 'branch-1',
  fiscalyearid: 'fy-1',
  lastCompletedMonth: '2026-05',
  compliance: {
    gstr1: {
      actionKey: 'gst.gstr1',
      pendingCount: 1,
      totalCount: 3,
    },
    gstr2b: {
      actionKey: 'gst.gstr2b',
      pendingCount: 2,
      totalCount: 3,
    },
  },
  pendingAllocations: {
    payments: {
      actionKey: 'payments.pendingAllocation',
      pendingCount: 0,
      totalCount: 2,
    },
    receipts: {
      actionKey: 'receipts.pendingAllocation',
      pendingCount: 2,
      totalCount: 3,
    },
  },
  pendingJournals: {
    payments: {
      actionKey: 'payments.pendingJournal',
      pendingCount: 0,
      totalCount: 1,
    },
    purchaseInvoices: {
      actionKey: 'purchaseInvoices.pendingJournal',
      pendingCount: 1,
      totalCount: 2,
    },
    receipts: {
      actionKey: 'receipts.pendingJournal',
      pendingCount: 1,
      totalCount: 2,
    },
    saleInvoices: {
      actionKey: 'saleInvoices.pendingJournal',
      pendingCount: 3,
      totalCount: 4,
    },
  },
  pendingReconciliation: {
    bankTransactions: {
      actionKey: 'bankTransactions.pendingReconciliation',
      pendingCount: 2,
      totalCount: 4,
    },
  },
};

describe('AccountantDashboardService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads summary from the endpoint with branch and fiscal-year guardrail params', async () => {
    const get = vi.fn(async (_url: string, _options?: { params: HttpParams }) => summary);

    TestBed.configureTestingModule({
      providers: [
        AccountantDashboardService,
        { provide: ApiClientService, useValue: { get } },
        {
          provide: AppConfigStore,
          useValue: {
            config: signal(config('https://api.example.com/')),
            load: vi.fn(),
          },
        },
      ],
    });

    const service = TestBed.inject(AccountantDashboardService);
    await expect(
      service.loadSummary({ branchid: 'branch-1', fiscalyearid: 'fy-1' }),
    ).resolves.toBe(summary);

    expect(get).toHaveBeenCalledOnce();
    expect(get.mock.calls[0][0]).toBe(
      'https://api.example.com/accounting/accountant-dashboard/summary',
    );
    expect(get.mock.calls[0]).toHaveLength(2);

    const params = get.mock.calls[0][1]?.params as HttpParams;
    expect(params.get('branchid')).toBe('branch-1');
    expect(params.get('fiscalyearid')).toBe('fy-1');
    expect(params.has('asOfDate')).toBe(false);
  });

  it('serializes optional as-of date query params', async () => {
    const get = vi.fn(async (_url: string, _options?: { params: HttpParams }) => summary);

    TestBed.configureTestingModule({
      providers: [
        AccountantDashboardService,
        { provide: ApiClientService, useValue: { get } },
        {
          provide: AppConfigStore,
          useValue: {
            config: signal(config('https://api.example.com/')),
            load: vi.fn(),
          },
        },
      ],
    });

    const service = TestBed.inject(AccountantDashboardService);
    await service.loadSummary({
      asOfDate: '2026-06-19',
      branchid: 'branch-1',
      fiscalyearid: 'fy-1',
    });

    const params = get.mock.calls[0][1]?.params as HttpParams;
    expect(params.get('asOfDate')).toBe('2026-06-19');
    expect(params.get('branchid')).toBe('branch-1');
    expect(params.get('fiscalyearid')).toBe('fy-1');
  });
});
