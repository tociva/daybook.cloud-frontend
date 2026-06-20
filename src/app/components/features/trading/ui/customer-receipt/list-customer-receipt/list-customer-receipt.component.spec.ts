import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { CrudListQueryService } from '../../../../../../shared/crud';
import type { Lb4ListQuery } from '../../../../../../shared/crud';
import { JournalService } from '../../../../accounting/data/journal';
import { ReconciliationMatchService } from '../../../../accounting/data/reconciliation-match';
import { BankCashStore } from '../../../data/bank-cash';
import { CustomerStore } from '../../../data/customer';
import { CustomerReceiptStore } from '../../../data/customer-receipt';
import { ListCustomerReceiptComponent } from './list-customer-receipt.component';

type CustomerReceiptListHarness = Readonly<{
  loadCustomerReceiptsWithJournals(filter: Lb4ListQuery): Promise<void>;
}>;

function asHarness(component: ListCustomerReceiptComponent): CustomerReceiptListHarness {
  return component as unknown as CustomerReceiptListHarness;
}

function setup(options: Readonly<{ queryParams?: Record<string, string> }> = {}) {
  const loadCustomerReceipts = vi.fn(async () => undefined);
  const storeError = signal<string | null>('Stop after query assertion.');
  const queryParamMap = convertToParamMap(options.queryParams ?? {});

  TestBed.configureTestingModule({
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          queryParamMap: of(queryParamMap),
          snapshot: { queryParamMap },
        },
      },
      {
        provide: BankCashStore,
        useValue: {
          items: signal([]),
          loadBankCashes: vi.fn(async () => undefined),
        },
      },
      {
        provide: CrudListQueryService,
        useValue: {
          init: vi.fn(),
        },
      },
      {
        provide: CustomerReceiptStore,
        useValue: {
          count: signal(0),
          error: storeError,
          isLoading: signal(false),
          items: signal([]),
          loadCustomerReceipts,
        },
      },
      {
        provide: CustomerStore,
        useValue: {
          items: signal([]),
          loadCustomers: vi.fn(async () => undefined),
        },
      },
      {
        provide: DateManagementService,
        useValue: {
          formatDisplayDate: vi.fn((value: string | undefined, fallback = '-') => value ?? fallback),
        },
      },
      {
        provide: JournalService,
        useValue: {
          createFromCustomerReceipt: vi.fn(),
        },
      },
      {
        provide: ReconciliationMatchService,
        useValue: {
          findJournalsBySourceIds: vi.fn(async () => []),
        },
      },
      {
        provide: Router,
        useValue: {
          navigate: vi.fn(),
          url: '/app/trading/customer-receipt',
        },
      },
      {
        provide: ToastStore,
        useValue: {
          danger: vi.fn(),
          success: vi.fn(),
        },
      },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new ListCustomerReceiptComponent());

  return {
    component: asHarness(component),
    loadCustomerReceipts,
  };
}

describe('ListCustomerReceiptComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads customer receipts by ascending date when no sort order is specified', async () => {
    const { component, loadCustomerReceipts } = setup();

    await component.loadCustomerReceiptsWithJournals({ limit: 10, offset: 0 });

    expect(loadCustomerReceipts).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['date ASC'],
      includes: ['customer', 'bcash'],
    });
  });

  it('preserves an explicitly specified sort order', async () => {
    const { component, loadCustomerReceipts } = setup();

    await component.loadCustomerReceiptsWithJournals({
      limit: 10,
      offset: 0,
      order: ['amount DESC'],
      where: { customerid: 'customer-1' },
    });

    expect(loadCustomerReceipts).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['amount DESC'],
      where: { customerid: 'customer-1' },
      includes: ['customer', 'bcash'],
    });
  });

  it('skips normal receipt loading when dashboard journal-link mode is active', async () => {
    const { component, loadCustomerReceipts } = setup({
      queryParams: {
        sourceType: 'receipt',
        status: 'not_fully_linked',
      },
    });

    await component.loadCustomerReceiptsWithJournals({ limit: 10, offset: 0 });

    expect(loadCustomerReceipts).not.toHaveBeenCalled();
  });
});
