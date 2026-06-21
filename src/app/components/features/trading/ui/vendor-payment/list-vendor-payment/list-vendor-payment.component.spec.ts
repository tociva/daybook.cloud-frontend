import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { CrudListQueryService } from '../../../../../../shared/crud';
import type { CrudFilterField, Lb4ListQuery } from '../../../../../../shared/crud';
import { JournalService } from '../../../../accounting/data/journal';
import { ReconciliationMatchService } from '../../../../accounting/data/reconciliation-match';
import { BankCashStore } from '../../../data/bank-cash';
import { VendorStore } from '../../../data/vendor';
import { VendorPaymentService, VendorPaymentStore } from '../../../data/vendor-payment';
import { ListVendorPaymentComponent } from './list-vendor-payment.component';
import { VendorPaymentBulkUploadValidationService } from './vendor-payment-bulk-upload-validation.service';

type VendorPaymentListHarness = Readonly<{
  filterFields: readonly CrudFilterField[];
  loadVendorPaymentsWithJournals(filter: Lb4ListQuery): Promise<void>;
}>;

function asHarness(component: ListVendorPaymentComponent): VendorPaymentListHarness {
  return component as unknown as VendorPaymentListHarness;
}

function setup() {
  const loadVendorPayments = vi.fn(async () => undefined);
  const storeError = signal<string | null>('Stop after query assertion.');

  TestBed.configureTestingModule({
    providers: [
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
          formatDisplayDate: vi.fn(
            (value: string | undefined, fallback = '-') => value ?? fallback,
          ),
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
        provide: VendorPaymentService,
        useValue: {
          count: vi.fn(async () => 301),
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

  it('loads vendor payments with the dashboard journal-link status in the normal list filter', async () => {
    const { component, loadVendorPayments } = setup();

    await component.loadVendorPaymentsWithJournals({
      limit: 10,
      offset: 0,
      where: { journallinkstatus: 'not_fully_linked' },
    });

    expect(loadVendorPayments).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['date ASC'],
      where: { journallinkstatus: 'not_fully_linked' },
      includes: ['vendor', 'bcash'],
    });
  });

  it('exposes journal link status as a standard vendor payment filter field', () => {
    const { component } = setup();
    const field = component.filterFields.find((item) => item.id === 'journallinkstatus');

    expect(field).toEqual({
      id: 'journallinkstatus',
      label: 'Journal link status',
      placeholder: 'Any journal link status',
      type: 'enum',
      options: [
        { label: 'Not fully linked', value: 'not_fully_linked' },
        { label: 'No journals', value: 'unlinked' },
        { label: 'Partially linked', value: 'partial' },
        { label: 'Fully linked', value: 'linked' },
      ],
    });
  });
});
