import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { TngTableColumn } from '@tailng-ui/components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { CrudListQueryService } from '../../../../../../shared/crud';
import type { CrudFilterField, Lb4ListQuery } from '../../../../../../shared/crud';
import { BankCashStore } from '../../../../trading/data/bank-cash';
import { BankTxnService, BankTxnStore } from '../../../data/bank-txn';
import type { BankTxn } from '../../../data/bank-txn';
import { InventoryLedgerMapStore } from '../../../data/inventory-ledger-map';
import { ReconciliationMatchService } from '../../../data/reconciliation-match';
import { JournalCreateDraftStagingService } from '../../journal/create-journal/journal-create-draft-staging.service';
import { ListBankTxnComponent } from './list-bank-txn.component';

type BankTxnListHarness = Readonly<{
  columns(): readonly TngTableColumn<BankTxn>[];
  createContraEntry(item: BankTxn): void;
  filterFields: readonly CrudFilterField[];
  loadBankTxnsWithJournals(filter: Lb4ListQuery): Promise<void>;
}>;

function asHarness(component: ListBankTxnComponent): BankTxnListHarness {
  return component as unknown as BankTxnListHarness;
}

function setup(
  options: Readonly<{
    bankTxns?: readonly BankTxn[];
    hasActiveFilter?: boolean;
    storeError?: string | null;
  }> = {},
): {
  component: BankTxnListHarness;
  findJournalsBySourceIds: ReturnType<typeof vi.fn>;
  loadBankTxns: ReturnType<typeof vi.fn>;
  navigate: ReturnType<typeof vi.fn>;
} {
  const bankTxns = signal<readonly BankTxn[]>(options.bankTxns ?? []);
  const storeError = signal<string | null>(
    options.storeError === undefined ? 'Stop after query assertion.' : options.storeError,
  );
  const hasActiveFilter = signal(options.hasActiveFilter ?? false);
  const loadBankTxns = vi.fn(async () => undefined);
  const findJournalsBySourceIds = vi.fn(async () => []);
  const navigate = vi.fn();

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
        provide: BankTxnStore,
        useValue: {
          count: signal(0),
          error: storeError,
          isLoading: signal(false),
          items: bankTxns,
          loadBankTxns,
        },
      },
      {
        provide: BankTxnService,
        useValue: {
          count: vi.fn(async () => 301),
        },
      },
      {
        provide: CrudListQueryService,
        useValue: {
          filter: signal({ limit: 10, offset: 0 }),
          hasActiveFilter,
          init: vi.fn(),
          pageSizeOptions: signal([10, 25, 50]),
          shouldShowEmptyState: vi.fn(() => false),
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
        provide: InventoryLedgerMapStore,
        useValue: {
          items: signal([]),
          loadInventoryLedgerMaps: vi.fn(async () => undefined),
        },
      },
      {
        provide: JournalCreateDraftStagingService,
        useValue: {
          clear: vi.fn(),
        },
      },
      {
        provide: ReconciliationMatchService,
        useValue: {
          findJournalsBySourceIds,
        },
      },
      {
        provide: Router,
        useValue: {
          navigate,
          url: '/app/accounting/banking',
        },
      },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new ListBankTxnComponent());

  return {
    component: asHarness(component),
    findJournalsBySourceIds,
    loadBankTxns,
    navigate,
  };
}

describe('ListBankTxnComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads bank transactions with the dashboard journal-link status in the normal list filter', async () => {
    const { component, loadBankTxns } = setup();

    await component.loadBankTxnsWithJournals({
      limit: 10,
      offset: 0,
      where: { journallinkstatus: 'not_fully_linked' },
    });

    expect(loadBankTxns).toHaveBeenCalledWith({
      includes: ['inventoryledgermap'],
      limit: 10,
      offset: 0,
      where: { journallinkstatus: 'not_fully_linked' },
    });
  });

  it('keeps loading linked journals for bank table rows', async () => {
    const { component, findJournalsBySourceIds } = setup({
      bankTxns: [
        {
          id: 'bank-txn-1',
          inventoryledgermapid: 'map-1',
          txndate: '2026-06-19',
        },
      ],
      storeError: null,
    });

    await component.loadBankTxnsWithJournals({
      limit: 10,
      offset: 0,
      where: { journallinkstatus: 'not_fully_linked' },
    });

    expect(findJournalsBySourceIds).toHaveBeenCalledWith('bank_txn', ['bank-txn-1']);
  });

  it('shows the balance column when no filter is active', () => {
    const { component } = setup();

    expect(component.columns().map((column) => column.id)).toContain('balance');
  });

  it('hides the balance column when a filter is active', () => {
    const { component } = setup({ hasActiveFilter: true });

    expect(component.columns().map((column) => column.id)).not.toContain('balance');
  });

  it('exposes journal link status as a standard bank transaction filter field', () => {
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

  it('prefills a contra entry from a deposit bank transaction', () => {
    const { component, navigate } = setup();

    component.createContraEntry({
      id: 'bank-txn-1',
      inventoryledgermapid: 'map-1',
      inventoryledgermap: {
        entityid: 'bank-1',
        entitytype: 'bankCash',
        ledgerid: 'ledger-1',
      },
      debit: 1250.5,
      description: 'Cash deposit',
      txndate: '2026-06-19',
    });

    expect(navigate).toHaveBeenCalledWith(['/app/trading/bank-cash/contra/create'], {
      queryParams: {
        amount: '1250.5',
        burl: '/app/accounting/banking',
        date: '2026-06-19',
        description: 'Cash deposit',
        tobcashid: 'bank-1',
      },
    });
  });

  it('prefills a contra entry from a withdrawal bank transaction', () => {
    const { component, navigate } = setup();

    component.createContraEntry({
      id: 'bank-txn-1',
      inventoryledgermapid: 'map-1',
      inventoryledgermap: {
        entityid: 'bank-1',
        entitytype: 'bankCash',
        ledgerid: 'ledger-1',
      },
      credit: 750,
      description: 'ATM withdrawal',
      txndate: '2026-06-19',
    });

    expect(navigate).toHaveBeenCalledWith(['/app/trading/bank-cash/contra/create'], {
      queryParams: {
        amount: '750',
        burl: '/app/accounting/banking',
        date: '2026-06-19',
        description: 'ATM withdrawal',
        frombcashid: 'bank-1',
      },
    });
  });

  it('navigates to contra create with derivable fields when the bank mapping is missing', () => {
    const { component, navigate } = setup();

    component.createContraEntry({
      id: 'bank-txn-1',
      inventoryledgermapid: 'map-1',
      debit: 500,
      txndate: '2026-06-19',
    });

    expect(navigate).toHaveBeenCalledWith(['/app/trading/bank-cash/contra/create'], {
      queryParams: {
        amount: '500',
        burl: '/app/accounting/banking',
        date: '2026-06-19',
      },
    });
  });
});
