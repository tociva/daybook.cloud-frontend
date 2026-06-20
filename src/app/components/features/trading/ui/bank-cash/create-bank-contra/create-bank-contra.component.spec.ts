import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS } from '../../../../../../util/constants';
import { CurrencyStore } from '../../../../management/data/currency/currency.store';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import type { BankCash } from '../../../data/bank-cash';
import { BankCashService } from '../../../data/bank-cash';
import type { ContraTransaction } from '../../../data/contra-transaction';
import { ContraTransactionFacade, ContraTransactionStore } from '../../../data/contra-transaction';
import { CreateBankContraComponent } from './create-bank-contra.component';

type CreateBankContraHarness = Readonly<{
  amount(): string;
  currencycode(): string;
  date(): string;
  description(): string;
  fromBankCashOptions(): BankCash[];
  frombcashid(): string;
  onBankCashQueryChange(side: 'from' | 'to', value: unknown): void;
  onFromBankCashValueChange(value: unknown): void;
  onToBankCashValueChange(value: unknown): void;
  selectedFromBankCash(): BankCash | null;
  selectedToBankCash(): BankCash | null;
  toBankCashOptions(): BankCash[];
  tobcashid(): string;
}>;

const cash: BankCash = {
  id: 'cash-1',
  name: 'Main Cash',
};

const bank: BankCash = {
  id: 'bank-1',
  name: 'Operating Bank',
};

const pettyCash: BankCash = {
  id: 'petty-cash-1',
  name: 'Petty Cash',
};

function asHarness(component: CreateBankContraComponent): CreateBankContraHarness {
  return component as unknown as CreateBankContraHarness;
}

async function flushInitialState(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function flushBankCashSearch(): Promise<void> {
  await new Promise<void>((resolve) =>
    setTimeout(resolve, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS + 10),
  );
}

function contra(overrides: Partial<ContraTransaction> = {}): ContraTransaction {
  return {
    id: 'contra-1',
    amount: 200,
    currencycode: 'USD',
    date: '2026-05-01',
    description: 'Existing contra',
    frombcash: cash,
    frombcashid: 'cash-1',
    tobcash: bank,
    tobcashid: 'bank-1',
    ...overrides,
  };
}

function setup(
  options: Readonly<{
    bankCashLookup?: readonly BankCash[];
    initialBankCashes?: readonly BankCash[];
    params?: Record<string, string>;
    query?: Record<string, string>;
    selectedContra?: ContraTransaction | null;
  }> = {},
): {
  component: CreateBankContraHarness;
  listBankCashes: ReturnType<typeof vi.fn>;
  loadContraTransactionById: ReturnType<typeof vi.fn>;
} {
  const bankCashLookup = options.bankCashLookup ?? [cash, bank, pettyCash];
  const initialBankCashes = options.initialBankCashes ?? [cash, bank];
  const listBankCashes = vi.fn(async (query?: unknown) => {
    const term = bankCashSearchTerm(query);
    if (!term) return initialBankCashes;

    return bankCashLookup.filter((item) => item.name.toLowerCase().includes(term));
  });
  const selectedItem = signal<ContraTransaction | null>(options.selectedContra ?? null);
  const loadContraTransactionById = vi.fn(async (id: string) => contra({ id }));

  TestBed.configureTestingModule({
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap(options.params ?? {}),
            queryParamMap: convertToParamMap(options.query ?? {}),
          },
        },
      },
      {
        provide: BankCashService,
        useValue: {
          getById: vi.fn(async (id: string) => bankCashLookup.find((item) => item.id === id)),
          list: listBankCashes,
        },
      },
      {
        provide: ContraTransactionFacade,
        useValue: {
          create: vi.fn(),
          update: vi.fn(),
        },
      },
      {
        provide: ContraTransactionStore,
        useValue: {
          clearError: vi.fn(),
          clearSelectedItem: vi.fn(),
          error: signal(null),
          isLoading: signal(false),
          loadContraTransactionById,
          selectedItem,
        },
      },
      {
        provide: CurrencyStore,
        useValue: {
          currencies: signal([{ code: 'INR', name: 'Indian Rupee', symbol: 'INR' }]),
          load: vi.fn(async () => undefined),
        },
      },
      {
        provide: FiscalYearDateRangeService,
        useValue: {
          defaultDate: vi.fn((value?: string) => value ?? '2026-04-01'),
          errorMessage: vi.fn(() => null),
          toIsoDate: vi.fn((value: unknown) =>
            typeof value === 'string' && value.trim() ? value.trim().slice(0, 10) : null,
          ),
        },
      },
      {
        provide: BurlNavigationService,
        useValue: {
          navigateBack: vi.fn(async () => undefined),
        },
      },
      {
        provide: UserSessionStore,
        useValue: {
          session: signal({
            branch: { currencycode: 'INR', id: 'branch-1', organizationid: 'org-1' },
            fiscalyear: { currencycode: 'INR', id: 'fy-1' },
            organization: { id: 'org-1' },
            userid: 'user-1',
          }),
        },
      },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new CreateBankContraComponent());

  return {
    component: asHarness(component),
    listBankCashes,
    loadContraTransactionById,
  };
}

function bankCashSearchTerm(query: unknown): string {
  const ilike = (query as { where?: { name?: { ilike?: string } } } | undefined)?.where?.name
    ?.ilike;
  return typeof ilike === 'string' ? ilike.replace(/%/g, '').trim().toLowerCase() : '';
}

describe('CreateBankContraComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    globalThis.localStorage?.clear();
  });

  it('applies create-mode prefill query params after defaults load', async () => {
    const { component } = setup({
      query: {
        amount: '1250.5',
        date: '2026-06-19',
        description: 'Cash deposit',
        frombcashid: 'cash-1',
        tobcashid: 'bank-1',
      },
    });

    await flushInitialState();

    expect(component.date()).toBe('2026-06-19');
    expect(component.amount()).toBe('1250.5');
    expect(component.currencycode()).toBe('INR');
    expect(component.description()).toBe('Cash deposit');
    expect(component.frombcashid()).toBe('cash-1');
    expect(component.tobcashid()).toBe('bank-1');
    expect(component.selectedFromBankCash()).toEqual(cash);
    expect(component.selectedToBankCash()).toEqual(bank);
  });

  it('does not inject the selected from account into the to account options', async () => {
    const { component } = setup({
      bankCashLookup: [cash, bank],
      initialBankCashes: [bank],
    });

    await flushInitialState();

    component.onBankCashQueryChange('from', 'Main Cash');
    await flushBankCashSearch();
    component.onFromBankCashValueChange('cash-1');

    expect(component.fromBankCashOptions()).toEqual([cash]);
    expect(component.toBankCashOptions()).toEqual([bank]);
  });

  it('narrows only the searched bank/cash autocomplete options', async () => {
    const { component } = setup({
      bankCashLookup: [cash, bank],
      initialBankCashes: [bank],
    });

    await flushInitialState();

    component.onBankCashQueryChange('from', 'Main Cash');
    await flushBankCashSearch();

    expect(component.fromBankCashOptions()).toEqual([cash]);
    expect(component.toBankCashOptions()).toEqual([bank]);
  });

  it('preserves edit selections independently when they are not in loaded options', async () => {
    const selectedContra = contra({
      frombcash: undefined,
      tobcash: undefined,
    });
    const { component } = setup({
      initialBankCashes: [pettyCash],
      params: { id: 'contra-1' },
      selectedContra,
    });

    await flushInitialState();

    expect(component.fromBankCashOptions()).toEqual([cash, pettyCash]);
    expect(component.toBankCashOptions()).toEqual([bank, pettyCash]);
  });

  it('ignores prefill query params in edit mode and hydrates from the contra', async () => {
    const selectedContra = contra();
    const { component, loadContraTransactionById } = setup({
      params: { id: 'contra-1' },
      query: {
        amount: '999',
        date: '2026-06-19',
        description: 'Query description',
        frombcashid: 'bank-1',
        tobcashid: 'cash-1',
      },
      selectedContra,
    });

    await flushInitialState();

    expect(loadContraTransactionById).not.toHaveBeenCalled();
    expect(component.date()).toBe('2026-05-01');
    expect(component.amount()).toBe('200');
    expect(component.currencycode()).toBe('USD');
    expect(component.description()).toBe('Existing contra');
    expect(component.frombcashid()).toBe('cash-1');
    expect(component.tobcashid()).toBe('bank-1');
  });
});
