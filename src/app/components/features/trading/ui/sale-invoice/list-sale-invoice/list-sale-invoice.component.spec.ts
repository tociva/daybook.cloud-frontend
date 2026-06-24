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
import { CustomerStore } from '../../../data/customer';
import {
  SaleInvoicePrintService,
  SaleInvoiceService,
  SaleInvoiceStore,
} from '../../../data/sale-invoice';
import { ListSaleInvoiceComponent } from './list-sale-invoice.component';
import { SaleInvoiceBulkUploadValidationService } from './sale-invoice-bulk-upload-validation.service';

type SaleInvoiceListHarness = Readonly<{
  filterFields: readonly CrudFilterField[];
  loadSaleInvoicesWithJournals(filter: Lb4ListQuery): Promise<void>;
}>;

function asHarness(component: ListSaleInvoiceComponent): SaleInvoiceListHarness {
  return component as unknown as SaleInvoiceListHarness;
}

function setup() {
  const loadSaleInvoices = vi.fn(async () => undefined);
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
        provide: CustomerStore,
        useValue: {
          items: signal([]),
          loadCustomers: vi.fn(async () => undefined),
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
          createFromSaleInvoice: vi.fn(),
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
          url: '/app/trading/sale-invoice',
        },
      },
      {
        provide: SaleInvoiceBulkUploadValidationService,
        useValue: {
          branchMinorUnit: signal(2),
          prepare: vi.fn(async () => undefined),
          validateReferences: vi.fn(async () => []),
        },
      },
      {
        provide: SaleInvoicePrintService,
        useValue: {
          previewInvoicePdf: vi.fn(async () => undefined),
        },
      },
      {
        provide: SaleInvoiceService,
        useValue: {
          count: vi.fn(async () => 301),
        },
      },
      {
        provide: SaleInvoiceStore,
        useValue: {
          count: signal(0),
          error: storeError,
          isLoading: signal(false),
          items: signal([]),
          loadSaleInvoices,
          setSelectedItem: vi.fn(),
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

  const component = TestBed.runInInjectionContext(() => new ListSaleInvoiceComponent());

  return {
    component: asHarness(component),
    loadSaleInvoices,
  };
}

describe('ListSaleInvoiceComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads sale invoices by ascending date and number when no sort order is specified', async () => {
    const { component, loadSaleInvoices } = setup();

    await component.loadSaleInvoicesWithJournals({ limit: 10, offset: 0 });

    expect(loadSaleInvoices).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['date ASC', 'number ASC'],
      includes: ['customer', 'receipts'],
    });
  });

  it('preserves an explicitly specified sort order', async () => {
    const { component, loadSaleInvoices } = setup();

    await component.loadSaleInvoicesWithJournals({
      limit: 10,
      offset: 0,
      order: ['grandtotal DESC'],
      where: { customerid: 'customer-1' },
    });

    expect(loadSaleInvoices).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['grandtotal DESC'],
      where: { customerid: 'customer-1' },
      includes: ['customer', 'receipts'],
    });
  });

  it('loads sale invoices with receipt status in the normal list filter', async () => {
    const { component, loadSaleInvoices } = setup();

    await component.loadSaleInvoicesWithJournals({
      limit: 10,
      offset: 0,
      where: { receiptstatus: 'not_paid' },
    });

    expect(loadSaleInvoices).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['date ASC', 'number ASC'],
      where: { receiptstatus: 'not_paid' },
      includes: ['customer', 'receipts'],
    });
  });

  it('loads sale invoices with receipt status and journal link status combined', async () => {
    const { component, loadSaleInvoices } = setup();

    await component.loadSaleInvoicesWithJournals({
      limit: 10,
      offset: 0,
      where: { receiptstatus: 'partially_paid', journallinkstatus: 'linked' },
    });

    expect(loadSaleInvoices).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['date ASC', 'number ASC'],
      where: { receiptstatus: 'partially_paid', journallinkstatus: 'linked' },
      includes: ['customer', 'receipts'],
    });
  });

  it('loads sale invoices with the dashboard journal-link status in the normal list filter', async () => {
    const { component, loadSaleInvoices } = setup();

    await component.loadSaleInvoicesWithJournals({
      limit: 10,
      offset: 0,
      where: { journallinkstatus: 'not_fully_linked' },
    });

    expect(loadSaleInvoices).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['date ASC', 'number ASC'],
      where: { journallinkstatus: 'not_fully_linked' },
      includes: ['customer', 'receipts'],
    });
  });

  it('exposes receipt status as a standard sale invoice filter field', () => {
    const { component } = setup();
    const field = component.filterFields.find((item) => item.id === 'receiptstatus');

    expect(field).toEqual({
      id: 'receiptstatus',
      label: 'Receipt status',
      placeholder: 'Any receipt status',
      type: 'enum',
      options: [
        { label: 'Fully paid', value: 'fully_paid' },
        { label: 'Partially paid', value: 'partially_paid' },
        { label: 'Not paid', value: 'not_paid' },
      ],
    });
  });

  it('exposes journal link status as a standard sale invoice filter field', () => {
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
