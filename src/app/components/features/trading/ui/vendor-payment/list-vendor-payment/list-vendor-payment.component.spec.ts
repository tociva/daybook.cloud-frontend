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
import { VendorStore } from '../../../data/vendor';
import { VendorPaymentStore } from '../../../data/vendor-payment';
import { ListVendorPaymentComponent } from './list-vendor-payment.component';
import { VendorPaymentBulkUploadValidationService } from './vendor-payment-bulk-upload-validation.service';

type VendorPaymentListHarness = Readonly<{
  loadVendorPaymentsWithJournals(filter: Lb4ListQuery): Promise<void>;
}>;

function asHarness(component: ListVendorPaymentComponent): VendorPaymentListHarness {
  return component as unknown as VendorPaymentListHarness;
}

function setup(options: Readonly<{ queryParams?: Record<string, string> }> = {}) {
  const loadVendorPayments = vi.fn(async () => undefined);
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
        provide: DateManagementService,
        useValue: {
          formatDisplayDate: vi.fn((value: string | undefined, fallback = '-') => value ?? fallback),
        },
      },
      {
        provide: JournalService,
        useValue: {
          createFromVendorPayment: vi.fn(),
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
          url: '/app/trading/vendor-payment',
        },
      },
      {
        provide: ToastStore,
        useValue: {
          danger: vi.fn(),
          success: vi.fn(),
        },
      },
      {
        provide: VendorPaymentBulkUploadValidationService,
        useValue: {
          validateReferences: vi.fn(async () => []),
        },
      },
      {
        provide: VendorPaymentStore,
        useValue: {
          count: signal(0),
          error: storeError,
          isLoading: signal(false),
          items: signal([]),
          loadVendorPayments,
        },
      },
      {
        provide: VendorStore,
        useValue: {
          items: signal([]),
          loadVendors: vi.fn(async () => undefined),
        },
      },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new ListVendorPaymentComponent());

  return {
    component: asHarness(component),
    loadVendorPayments,
  };
}

describe('ListVendorPaymentComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads vendor payments by ascending date when no sort order is specified', async () => {
    const { component, loadVendorPayments } = setup();

    await component.loadVendorPaymentsWithJournals({ limit: 10, offset: 0 });

    expect(loadVendorPayments).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['date ASC'],
      includes: ['vendor', 'bcash'],
    });
  });

  it('preserves an explicitly specified sort order', async () => {
    const { component, loadVendorPayments } = setup();

    await component.loadVendorPaymentsWithJournals({
      limit: 10,
      offset: 0,
      order: ['amount DESC'],
      where: { vendorid: 'vendor-1' },
    });

    expect(loadVendorPayments).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['amount DESC'],
      where: { vendorid: 'vendor-1' },
      includes: ['vendor', 'bcash'],
    });
  });

  it('skips normal payment loading when dashboard journal-link mode is active', async () => {
    const { component, loadVendorPayments } = setup({
      queryParams: {
        sourceType: 'payment',
        status: 'not_fully_linked',
      },
    });

    await component.loadVendorPaymentsWithJournals({ limit: 10, offset: 0 });

    expect(loadVendorPayments).not.toHaveBeenCalled();
  });
});
