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
      greenMonths: 1,
      notStartedMonths: 0,
      partialMonths: 0,
    },
    gstr2b: {
      actionKey: 'gst.gstr2b',
      greenMonths: 0,
      notStartedMonths: 1,
      partialMonths: 0,
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
      amount: 250,
      count: 1,
      oldestDate: '2026-05-01',
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
      amount: 0,
      count: 0,
      oldestDate: null,
    },
    receipts: {
      actionKey: 'receipts.pendingJournal',
      amount: 0,
      count: 0,
      oldestDate: null,
    },
    saleInvoices: {
      actionKey: 'saleInvoices.pendingJournal',
      amount: 0,
      count: 0,
      oldestDate: null,
    },
  },
  pendingReconciliation: {
    bankTransactions: {
      actionKey: 'bankTransactions.pendingReconciliation',
      count: 0,
      creditAmount: 0,
      debitAmount: 0,
      oldestDate: null,
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
    const load = store.loadSummary();

    expect(store.isLoading()).toBe(true);
    expect(store.error()).toBeNull();
    expect(store.summary()).toBeNull();

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

