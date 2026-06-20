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
import { PurchaseInvoiceStore } from '../../../data/purchase-invoice';
import { VendorStore } from '../../../data/vendor';
import { ListPurchaseInvoiceComponent } from './list-purchase-invoice.component';
import { PurchaseInvoiceBulkUploadValidationService } from './purchase-invoice-bulk-upload-validation.service';

type PurchaseInvoiceListHarness = Readonly<{
  filterFields: readonly CrudFilterField[];
  loadPurchaseInvoicesWithJournals(filter: Lb4ListQuery): Promise<void>;
}>;

function asHarness(component: ListPurchaseInvoiceComponent): PurchaseInvoiceListHarness {
  return component as unknown as PurchaseInvoiceListHarness;
}

function setup() {
  const loadPurchaseInvoices = vi.fn(async () => undefined);
  const storeError = signal<string | null>('Stop after query assertion.');

  TestBed.configureTestingModule({
    providers: [
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
          createFromPurchaseInvoice: vi.fn(),
        },
      },
      {
        provide: PurchaseInvoiceBulkUploadValidationService,
        useValue: {
          branchMinorUnit: signal(2),
          prepare: vi.fn(async () => undefined),
          validateReferences: vi.fn(async () => []),
        },
      },
      {
        provide: PurchaseInvoiceStore,
        useValue: {
          count: signal(0),
          error: storeError,
          isLoading: signal(false),
          items: signal([]),
          loadPurchaseInvoices,
          setSelectedItem: vi.fn(),
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
          url: '/app/trading/purchase-invoice',
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
        provide: VendorStore,
        useValue: {
          items: signal([]),
          loadVendors: vi.fn(async () => undefined),
        },
      },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new ListPurchaseInvoiceComponent());

  return {
    component: asHarness(component),
    loadPurchaseInvoices,
  };
}

describe('ListPurchaseInvoiceComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads purchase invoices by ascending date when no sort order is specified', async () => {
    const { component, loadPurchaseInvoices } = setup();

    await component.loadPurchaseInvoicesWithJournals({ limit: 10, offset: 0 });

    expect(loadPurchaseInvoices).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['date ASC'],
      includes: ['vendor', 'payments', 'currency'],
    });
  });

  it('preserves an explicitly specified sort order', async () => {
    const { component, loadPurchaseInvoices } = setup();

    await component.loadPurchaseInvoicesWithJournals({
      limit: 10,
      offset: 0,
      order: ['grandtotal DESC'],
      where: { vendorid: 'vendor-1' },
    });

    expect(loadPurchaseInvoices).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['grandtotal DESC'],
      where: { vendorid: 'vendor-1' },
      includes: ['vendor', 'payments', 'currency'],
    });
  });

  it('loads purchase invoices with the dashboard journal-link status in the normal list filter', async () => {
    const { component, loadPurchaseInvoices } = setup();

    await component.loadPurchaseInvoicesWithJournals({
      limit: 10,
      offset: 0,
      where: { journallinkstatus: 'not_fully_linked' },
    });

    expect(loadPurchaseInvoices).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['date ASC'],
      where: { journallinkstatus: 'not_fully_linked' },
      includes: ['vendor', 'payments', 'currency'],
    });
  });

  it('exposes journal link status as a standard purchase invoice filter field', () => {
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
