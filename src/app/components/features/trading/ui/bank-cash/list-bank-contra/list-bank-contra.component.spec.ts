import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { CrudListQueryService } from '../../../../../../shared/crud';
import type { Lb4ListQuery } from '../../../../../../shared/crud';
import { JournalService, JournalSourceType } from '../../../../accounting/data/journal';
import type { Journal } from '../../../../accounting/data/journal';
import { ReconciliationMatchService } from '../../../../accounting/data/reconciliation-match';
import type { SourceJournalsGroup } from '../../../../accounting/data/reconciliation-match';
import { ContraTransactionStore } from '../../../data/contra-transaction';
import type { ContraTransaction, ContraTransactionJournal } from '../../../data/contra-transaction';
import { ListBankContraComponent } from './list-bank-contra.component';

type ContraListHarness = Readonly<{
  assignJournal(row: ContraTransaction): Promise<void>;
  hasJournals(row: ContraTransaction): boolean;
  linkedJournals(row: ContraTransaction): readonly ContraTransactionJournal[];
  loadContraTransactionsWithJournals(filter: Lb4ListQuery): Promise<void>;
}>;

function asHarness(component: ListBankContraComponent): ContraListHarness {
  return component as unknown as ContraListHarness;
}

const cash = { id: 'cash-1', name: 'Main Cash' };
const bank = { id: 'bank-1', name: 'Main Bank' };

function contra(overrides: Partial<ContraTransaction> = {}): ContraTransaction {
  return {
    amount: 1000,
    currencycode: 'INR',
    date: '2026-05-10',
    description: 'Cash deposit to bank',
    frombcash: cash,
    frombcashid: 'cash-1',
    id: 'contra-1',
    tobcash: bank,
    tobcashid: 'bank-1',
    ...overrides,
  };
}

function journal(overrides: Partial<Journal> = {}): Journal {
  return {
    date: '2026-05-10',
    fiscalyearid: 'fy-1',
    id: 'journal-1',
    number: 'JRN-1',
    ...overrides,
  };
}

function setup(
  options: Readonly<{
    items?: readonly ContraTransaction[];
    queryParams?: Record<string, string>;
  }> = {},
) {
  const rows = options.items ?? [contra()];
  const items = signal<readonly ContraTransaction[]>([]);
  const storeError = signal<string | null>(null);
  const queryParamMap = convertToParamMap(options.queryParams ?? {});
  const loadContraTransactions = vi.fn(async () => {
    items.set(rows);
  });
  const createFromContraTransaction = vi.fn(async () =>
    journal({ id: 'journal-created', number: 'JRN-CREATED' }),
  );
  const findJournalsBySourceIds = vi.fn(
    async (): Promise<readonly SourceJournalsGroup[]> => [],
  );
  const toastDanger = vi.fn();
  const toastSuccess = vi.fn();

  TestBed.configureTestingModule({
    providers: [
      { provide: PermissionsStore, useValue: { can: vi.fn(() => true) } },
      {
        provide: ActivatedRoute,
        useValue: {
          queryParamMap: of(queryParamMap),
          snapshot: { queryParamMap },
        },
      },
      {
        provide: ContraTransactionStore,
        useValue: {
          count: signal(rows.length),
          error: storeError,
          isLoading: signal(false),
          items,
          loadContraTransactions,
          setSelectedItem: vi.fn(),
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
          createFromContraTransaction,
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
          navigate: vi.fn(),
          url: '/app/trading/bank-cash/contra',
        },
      },
      {
        provide: ToastStore,
        useValue: {
          danger: toastDanger,
          success: toastSuccess,
        },
      },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new ListBankContraComponent());

  return {
    component: asHarness(component),
    createFromContraTransaction,
    findJournalsBySourceIds,
    loadContraTransactions,
    rows,
    toastDanger,
    toastSuccess,
  };
}

describe('ListBankContraComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads contra transactions by ascending date with bank/cash includes and requests linked journals', async () => {
    const { component, findJournalsBySourceIds, loadContraTransactions } = setup();

    await component.loadContraTransactionsWithJournals({ limit: 10, offset: 0 });

    expect(loadContraTransactions).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['date ASC'],
      includes: ['frombcash', 'tobcash'],
    });
    expect(findJournalsBySourceIds).toHaveBeenCalledWith(
      JournalSourceType.CONTRA_TRANSACTION,
      ['contra-1'],
    );
  });

  it('preserves an explicitly specified sort order', async () => {
    const { component, loadContraTransactions } = setup();

    await component.loadContraTransactionsWithJournals({
      limit: 10,
      offset: 0,
      order: ['amount DESC'],
      where: { description: { ilike: '%deposit%' } },
    });

    expect(loadContraTransactions).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      order: ['amount DESC'],
      where: { description: { ilike: '%deposit%' } },
      includes: ['frombcash', 'tobcash'],
    });
  });

  it('skips normal contra loading when dashboard journal-link mode is active', async () => {
    const { component, findJournalsBySourceIds, loadContraTransactions } = setup({
      queryParams: {
        sourceType: 'contra',
        status: 'not_fully_linked',
      },
    });

    await component.loadContraTransactionsWithJournals({ limit: 10, offset: 0 });

    expect(loadContraTransactions).not.toHaveBeenCalled();
    expect(findJournalsBySourceIds).not.toHaveBeenCalled();
  });

  it('maps returned source journal groups by contra id', async () => {
    const { component, findJournalsBySourceIds, rows } = setup();
    findJournalsBySourceIds.mockResolvedValueOnce([
      {
        sourceid: 'contra-1',
        journals: [{ id: 'journal-1', number: 'JRN-1' }],
      },
    ]);

    await component.loadContraTransactionsWithJournals({});

    expect(component.linkedJournals(rows[0])).toEqual([{ id: 'journal-1', number: 'JRN-1' }]);
    expect(component.hasJournals(rows[0])).toBe(true);
  });

  it('creates a journal for an unassigned contra and updates linked journals', async () => {
    const { component, createFromContraTransaction, rows, toastDanger, toastSuccess } = setup();

    await component.assignJournal(rows[0]);

    expect(createFromContraTransaction).toHaveBeenCalledWith('contra-1');
    expect(component.linkedJournals(rows[0])).toEqual([
      { id: 'journal-created', number: 'JRN-CREATED' },
    ]);
    expect(toastSuccess).toHaveBeenCalledWith('Journal generated.');
    expect(toastDanger).not.toHaveBeenCalled();
  });

  it('does not create a duplicate journal when the contra already has linked journals', async () => {
    const { component, createFromContraTransaction, findJournalsBySourceIds, rows } = setup();
    findJournalsBySourceIds.mockResolvedValueOnce([
      {
        sourceid: 'contra-1',
        journals: [{ id: 'journal-existing', number: 'JRN-EXISTING' }],
      },
    ]);
    await component.loadContraTransactionsWithJournals({});

    await component.assignJournal(rows[0]);

    expect(createFromContraTransaction).not.toHaveBeenCalled();
    expect(component.linkedJournals(rows[0])).toEqual([
      { id: 'journal-existing', number: 'JRN-EXISTING' },
    ]);
  });

  it('shows a danger toast when journal creation fails', async () => {
    const { component, createFromContraTransaction, rows, toastDanger, toastSuccess } = setup();
    createFromContraTransaction.mockRejectedValueOnce(new Error('create failed'));

    await component.assignJournal(rows[0]);

    expect(toastDanger).toHaveBeenCalledWith('create failed');
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(component.linkedJournals(rows[0])).toEqual([]);
  });
});
