import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountantDashboardSummary } from './accountant-dashboard.model';
import { AccountantDashboardService } from './accountant-dashboard.service';
import { AccountantDashboardStore } from './accountant-dashboard.store';

type Deferred<T> = Readonly<{
  promise: Promise<T>;
  reject: (error: unknown) => void;
  resolve: (value: T) => void;
}>;

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

const summary: AccountantDashboardSummary = {
  asOfDate: '2026-06-19',
  branchid: 'branch-1',
  fiscalyearid: 'fy-1',
  lastCompletedMonth: '2026-05',
  compliance: {
    gstr1: {
      actionKey: 'gst.gstr1',
      pendingCount: 0,
      totalCount: 1,
    },
    gstr2b: {
      actionKey: 'gst.gstr2b',
      pendingCount: 1,
      totalCount: 1,
    },
  },
  pendingAllocations: {
    payments: {
      actionKey: 'payments.pendingAllocation',
      pendingCount: 0,
      totalCount: 0,
    },
    receipts: {
      actionKey: 'receipts.pendingAllocation',
      pendingCount: 1,
      totalCount: 2,
    },
  },
  pendingJournals: {
    payments: {
      actionKey: 'payments.pendingJournal',
      pendingCount: 0,
      totalCount: 0,
    },
    purchaseInvoices: {
      actionKey: 'purchaseInvoices.pendingJournal',
      pendingCount: 0,
      totalCount: 0,
    },
    receipts: {
      actionKey: 'receipts.pendingJournal',
      pendingCount: 0,
      totalCount: 0,
    },
    saleInvoices: {
      actionKey: 'saleInvoices.pendingJournal',
      pendingCount: 0,
      totalCount: 0,
    },
  },
  pendingReconciliation: {
    bankTransactions: {
      actionKey: 'bankTransactions.pendingReconciliation',
      pendingCount: 0,
      totalCount: 0,
    },
  },
};

describe('AccountantDashboardStore', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('sets loading state, stores summary, and records loadedAt on success', async () => {
    const response = deferred<AccountantDashboardSummary>();
    const loadSummary = vi.fn(() => response.promise);

    TestBed.configureTestingModule({
      providers: [
        AccountantDashboardStore,
        { provide: AccountantDashboardService, useValue: { loadSummary } },
      ],
    });

    const store = TestBed.inject(AccountantDashboardStore);
    const query = { branchid: 'branch-1', fiscalyearid: 'fy-1' };
    const load = store.loadSummary(query);

    expect(store.isLoading()).toBe(true);
    expect(store.error()).toBeNull();
    expect(store.summary()).toBeNull();
    expect(loadSummary).toHaveBeenCalledWith(query);

    response.resolve(summary);
    await load;

    expect(loadSummary).toHaveBeenCalledOnce();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.summary()).toBe(summary);
    expect(store.loadedAt()).toEqual(expect.any(String));
  });

  it('normalizes load failures with the fallback message and can clear errors', async () => {
    const loadSummary = vi.fn(async () => {
      throw {};
    });

    TestBed.configureTestingModule({
      providers: [
        AccountantDashboardStore,
        { provide: AccountantDashboardService, useValue: { loadSummary } },
      ],
    });

    const store = TestBed.inject(AccountantDashboardStore);
    await store.loadSummary();

    expect(store.isLoading()).toBe(false);
    expect(store.summary()).toBeNull();
    expect(store.error()).toBe('Failed to load accountant dashboard.');

    store.clearError();

    expect(store.error()).toBeNull();
  });
});
