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
      greenMonths: 2,
      notStartedMonths: 1,
      partialMonths: 0,
    },
    gstr2b: {
      actionKey: 'gst.gstr2b',
      greenMonths: 1,
      notStartedMonths: 1,
      partialMonths: 1,
    },
  },
  pendingAllocations: {
    payments: {
      actionKey: 'payments.pendingAllocation',
      amount: 0,
      count: 0,
      oldestDate: null,
    },
    receipts: {
      actionKey: 'receipts.pendingAllocation',
      amount: 1200,
      count: 2,
      oldestDate: '2026-04-02',
    },
  },
  pendingJournals: {
    payments: {
      actionKey: 'payments.pendingJournal',
      amount: 0,
      count: 0,
      oldestDate: null,
    },
    purchaseInvoices: {
      actionKey: 'purchaseInvoices.pendingJournal',
      amount: 400,
      count: 1,
      oldestDate: '2026-04-10',
    },
    receipts: {
      actionKey: 'receipts.pendingJournal',
      amount: 100,
      count: 1,
      oldestDate: '2026-04-12',
    },
    saleInvoices: {
      actionKey: 'saleInvoices.pendingJournal',
      amount: 800,
      count: 3,
      oldestDate: '2026-04-01',
    },
  },
  pendingReconciliation: {
    bankTransactions: {
      actionKey: 'bankTransactions.pendingReconciliation',
      count: 2,
      creditAmount: 50,
      debitAmount: 75,
      oldestDate: '2026-04-07',
    },
  },
};

describe('AccountantDashboardService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads summary from the exact endpoint without branch or fiscal-year query params', async () => {
    const get = vi.fn(async () => summary);

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
    await expect(service.loadSummary()).resolves.toBe(summary);

    expect(get).toHaveBeenCalledOnce();
    expect(get).toHaveBeenCalledWith(
      'https://api.example.com/accounting/accountant-dashboard/summary',
    );
    expect(get.mock.calls[0]).toHaveLength(1);
  });
});

