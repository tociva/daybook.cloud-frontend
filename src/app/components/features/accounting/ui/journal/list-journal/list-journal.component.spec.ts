import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { CrudListQueryService } from '../../../../../../shared/crud';
import type { CrudFilterField } from '../../../../../../shared/crud';
import {
  JournalService,
  JournalSourceType,
  JournalStore,
  journalSourceTypeLabel,
} from '../../../data/journal';
import { LedgerStore } from '../../../data/ledger';
import { LedgerService } from '../../../data/ledger/ledger.service';
import {
  ReconciliationMatchFacade,
  ReconciliationMatchService,
} from '../../../data/reconciliation-match';
import { ContraTransactionService } from '../../../../trading/data/contra-transaction';
import { CustomerReceiptService } from '../../../../trading/data/customer-receipt';
import { PurchaseInvoiceService } from '../../../../trading/data/purchase-invoice';
import { SaleInvoiceService } from '../../../../trading/data/sale-invoice';
import { VendorPaymentService } from '../../../../trading/data/vendor-payment';
import { ListJournalComponent } from './list-journal.component';

type ListJournalHarness = Readonly<{
  filterFields: readonly CrudFilterField[];
}>;

function asHarness(component: ListJournalComponent): ListJournalHarness {
  return component as unknown as ListJournalHarness;
}

function setup(): ListJournalHarness {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: ContraTransactionService,
        useValue: {},
      },
      {
        provide: CrudListQueryService,
        useValue: {
          applySort: vi.fn(),
          clearFilter: vi.fn(),
          filter: signal({ limit: 10, offset: 0 }),
          hasActiveFilter: signal(false),
          init: vi.fn(),
          pageSizeOptions: signal([10, 25, 50]),
          shouldShowEmptyState: vi.fn(() => false),
          sortActive: signal(null),
          sortDirection: signal(null),
        },
      },
      {
        provide: CustomerReceiptService,
        useValue: {},
      },
      {
        provide: JournalStore,
        useValue: {
          count: signal(0),
          error: signal(null),
          isLoading: signal(false),
          items: signal([]),
          loadJournals: vi.fn(async () => undefined),
          setSelectedItem: vi.fn(),
        },
      },
      {
        provide: JournalService,
        useValue: {
          count: vi.fn(async () => 0),
        },
      },
      {
        provide: LedgerStore,
        useValue: {
          ledger: signal({
            catalog: [],
            count: 0,
            error: null,
            isLoading: false,
            items: [],
            selectedItem: null,
          }),
        },
      },
      {
        provide: LedgerService,
        useValue: {},
      },
      {
        provide: PurchaseInvoiceService,
        useValue: {},
      },
      {
        provide: ReconciliationMatchFacade,
        useValue: {
          unlinkJournalFromSource: vi.fn(async () => false),
        },
      },
      {
        provide: ReconciliationMatchService,
        useValue: {
          findByJournalIds: vi.fn(async () => []),
          findJournalsBySourceIds: vi.fn(async () => []),
        },
      },
      {
        provide: Router,
        useValue: {
          navigate: vi.fn(),
          url: '/app/accounting/journal',
        },
      },
      {
        provide: SaleInvoiceService,
        useValue: {},
      },
      {
        provide: ToastStore,
        useValue: {
          danger: vi.fn(),
          success: vi.fn(),
        },
      },
      {
        provide: VendorPaymentService,
        useValue: {},
      },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new ListJournalComponent());
  return asHarness(component);
}

describe('ListJournalComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('exposes a source type filter with all supported journal types', () => {
    const component = setup();
    const field = component.filterFields.find((item) => item.id === 'sourcetype');
    const values = [
      JournalSourceType.GENERAL,
      JournalSourceType.BANK_TXN,
      JournalSourceType.SALE_INVOICE,
      JournalSourceType.PURCHASE_INVOICE,
      JournalSourceType.RECEIPT,
      JournalSourceType.PAYMENT,
      JournalSourceType.CONTRA_TRANSACTION,
      JournalSourceType.CREDIT_NOTE,
      JournalSourceType.DEBIT_NOTE,
    ];

    expect(field).toEqual({
      id: 'sourcetype',
      label: 'Type',
      options: values.map((value) => ({
        label: journalSourceTypeLabel(value),
        value,
      })),
      placeholder: 'Any type',
      type: 'enum',
    });
  });
});
