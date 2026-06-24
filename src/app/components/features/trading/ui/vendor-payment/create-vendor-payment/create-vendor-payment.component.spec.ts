import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import type { UserSession } from '../../../../../features/management/data/user-session/user-session.model';
import { UserSessionStore } from '../../../../../features/management/data/user-session/user-session.store';
import { CurrencyStore } from '../../../../../features/management/data/currency/currency.store';
import { BankCashStore } from '../../../data/bank-cash';
import type { BankCash } from '../../../data/bank-cash/bank-cash.model';
import { PurchaseInvoiceStore } from '../../../data/purchase-invoice';
import { VendorStore } from '../../../data/vendor';
import { VendorPaymentFacade, VendorPaymentStore } from '../../../data/vendor-payment';
import { CreateVendorPaymentComponent } from './create-vendor-payment.component';

type CreateVendorPaymentHarness = Readonly<{
  bcashid(): string;
  pmtdate(): string;
  selectedBankCash(): BankCash | null;
  submitForm(event: Event): Promise<void>;
}>;

const scopedSession = {
  name: '',
  email: '',
  userid: 'user-1',
  member: null,
  memberorgs: [],
  organization: { id: 'org-1' },
  branch: { id: 'branch-1', organizationid: 'org-1', currencycode: 'INR' },
  fiscalyear: { id: 'fy-1', startdate: '2026-04-01', enddate: '2027-03-31' },
} as unknown as UserSession;

const scopedLastDateKey =
  'daybook:vendor-payment:create:last-date:user-1:org-1:branch-1:fy-1';

const scopedLastBcashKey =
  'daybook:vendor-payment:create:last-bcash:user-1:org-1:branch-1:fy-1';

const operatingBank: BankCash = {
  id: 'bcash-1',
  name: 'Operating Bank',
};

const pettyCash: BankCash = {
  id: 'bcash-2',
  name: 'Petty Cash',
};

function asHarness(component: CreateVendorPaymentComponent): CreateVendorPaymentHarness {
  return component as unknown as CreateVendorPaymentHarness;
}

async function flushInitialState(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function installLocalStorageMock(): void {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear: vi.fn(() => store.clear()),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, String(value));
    }),
  };

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });
}

function setup(
  options: Readonly<{
    bankCashes?: readonly BankCash[];
    createResult?: unknown | null;
    defaultDate?: (value?: string) => string;
    loadBankCashById?: (id: string) => Promise<BankCash | null>;
    params?: Record<string, string>;
  }> = {},
): {
  component: CreateVendorPaymentHarness;
  create: ReturnType<typeof vi.fn>;
  loadBankCashById: ReturnType<typeof vi.fn>;
  navigateBack: ReturnType<typeof vi.fn>;
} {
  const create = vi.fn(async () =>
    'createResult' in options ? options.createResult : { id: 'vpmt-1' },
  );
  const navigateBack = vi.fn(async () => undefined);
  const defaultDate = vi.fn(options.defaultDate ?? ((value?: string) => value ?? '2026-04-01'));
  const bankCashes = signal<BankCash[]>([...(options.bankCashes ?? [])]);
  const loadBankCashById = vi.fn(
    options.loadBankCashById ??
      (async (id: string) =>
        (options.bankCashes ?? []).find((bankCash) => bankCash.id === id) ?? null),
  );

  TestBed.configureTestingModule({
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap(options.params ?? {}),
            queryParamMap: convertToParamMap({}),
          },
        },
      },
      {
        provide: VendorPaymentFacade,
        useValue: {
          create,
          update: vi.fn(),
        },
      },
      {
        provide: VendorPaymentStore,
        useValue: {
          clearError: vi.fn(),
          error: signal(null),
          isLoading: signal(false),
          loadVendorPaymentById: vi.fn(),
        },
      },
      {
        provide: VendorStore,
        useValue: {
          items: signal([]),
          loadVendors: vi.fn(async () => undefined),
        },
      },
      {
        provide: BankCashStore,
        useValue: {
          items: bankCashes,
          loadBankCashById,
          loadBankCashes: vi.fn(async () => undefined),
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
        provide: PurchaseInvoiceStore,
        useValue: {
          clearSelectedItem: vi.fn(),
          loadPurchaseInvoiceById: vi.fn(),
          selectedItem: signal(null),
        },
      },
      {
        provide: FiscalYearDateRangeService,
        useValue: {
          defaultDate,
          errorMessage: vi.fn(() => null),
          toIsoDate: vi.fn((value: unknown) =>
            typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null,
          ),
        },
      },
      {
        provide: BurlNavigationService,
        useValue: { navigateBack },
      },
      {
        provide: UserSessionStore,
        useValue: { session: signal(scopedSession) },
      },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new CreateVendorPaymentComponent());

  return {
    component: asHarness(component),
    create,
    loadBankCashById,
    navigateBack,
  };
}

describe('CreateVendorPaymentComponent date memory', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    installLocalStorageMock();
    localStorage.clear();
  });

  it('applies the remembered vendor payment date on create-mode init', async () => {
    localStorage.setItem(scopedLastDateKey, '2026-05-02');
    const { component } = setup();

    await flushInitialState();

    expect(component.pmtdate()).toBe('2026-05-02');
  });

  it('ignores invalid remembered vendor payment dates', async () => {
    localStorage.setItem(scopedLastDateKey, 'not-a-date');
    const { component } = setup();

    await flushInitialState();

    expect(component.pmtdate()).toBe('2026-04-01');
  });

  it('remembers the payment date after a successful create', async () => {
    const { component } = setup();

    await flushInitialState();

    const harness = component as unknown as {
      pmtdate: { set(value: string): void };
      vendorid: { set(value: string): void };
      amount: { set(value: string): void };
      bcashid: { set(value: string): void };
      currencycode: { set(value: string): void };
    };

    harness.pmtdate.set('2026-06-15');
    harness.vendorid.set('vendor-1');
    harness.amount.set('100');
    harness.bcashid.set('bcash-1');
    harness.currencycode.set('INR');

    await component.submitForm(new Event('submit'));

    expect(localStorage.getItem(scopedLastDateKey)).toBe('2026-06-15');
  });

  it('does not remember the payment date when create fails', async () => {
    const { component } = setup({ createResult: null });
    const harness = component as unknown as {
      pmtdate: { set(value: string): void };
      vendorid: { set(value: string): void };
      amount: { set(value: string): void };
      bcashid: { set(value: string): void };
      currencycode: { set(value: string): void };
    };

    await flushInitialState();

    harness.pmtdate.set('2026-06-15');
    harness.vendorid.set('vendor-1');
    harness.amount.set('100');
    harness.bcashid.set('bcash-1');
    harness.currencycode.set('INR');

    await component.submitForm(new Event('submit'));

    expect(localStorage.getItem(scopedLastDateKey)).toBeNull();
  });
});

describe('CreateVendorPaymentComponent bank/cash memory', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    installLocalStorageMock();
    localStorage.clear();
  });

  it('applies the remembered bank/cash account when it is in the loaded list', async () => {
    localStorage.setItem(scopedLastBcashKey, 'bcash-1');
    const { component } = setup({ bankCashes: [operatingBank, pettyCash] });

    await flushInitialState();

    expect(component.bcashid()).toBe('bcash-1');
    expect(component.selectedBankCash()).toEqual(operatingBank);
  });

  it('resolves the remembered bank/cash account via loadBankCashById when not in the initial list', async () => {
    localStorage.setItem(scopedLastBcashKey, 'bcash-1');
    const { component, loadBankCashById } = setup({
      bankCashes: [pettyCash],
      loadBankCashById: async (id: string) => (id === 'bcash-1' ? operatingBank : null),
    });

    await flushInitialState();

    expect(loadBankCashById).toHaveBeenCalledWith('bcash-1');
    expect(component.bcashid()).toBe('bcash-1');
    expect(component.selectedBankCash()).toEqual(operatingBank);
  });

  it('ignores empty remembered bank/cash values', async () => {
    localStorage.setItem(scopedLastBcashKey, '   ');
    const { component } = setup({ bankCashes: [operatingBank] });

    await flushInitialState();

    expect(component.bcashid()).toBe('');
    expect(component.selectedBankCash()).toBeNull();
  });

  it('leaves bank/cash blank when the remembered account no longer resolves', async () => {
    localStorage.setItem(scopedLastBcashKey, 'missing-bcash');
    const { component } = setup({ bankCashes: [operatingBank] });

    await flushInitialState();

    expect(component.bcashid()).toBe('');
    expect(component.selectedBankCash()).toBeNull();
  });

  it('remembers the bank/cash account after a successful create', async () => {
    const { component } = setup({ bankCashes: [operatingBank] });

    await flushInitialState();

    const harness = component as unknown as {
      amount: { set(value: string): void };
      bcashid: { set(value: string): void };
      currencycode: { set(value: string): void };
      pmtdate: { set(value: string): void };
      vendorid: { set(value: string): void };
    };

    harness.pmtdate.set('2026-06-15');
    harness.vendorid.set('vendor-1');
    harness.amount.set('100');
    harness.bcashid.set('bcash-1');
    harness.currencycode.set('INR');

    await component.submitForm(new Event('submit'));

    expect(localStorage.getItem(scopedLastBcashKey)).toBe('bcash-1');
  });

  it('does not remember the bank/cash account when create fails', async () => {
    const { component } = setup({ bankCashes: [operatingBank], createResult: null });
    const harness = component as unknown as {
      amount: { set(value: string): void };
      bcashid: { set(value: string): void };
      currencycode: { set(value: string): void };
      pmtdate: { set(value: string): void };
      vendorid: { set(value: string): void };
    };

    await flushInitialState();

    harness.pmtdate.set('2026-06-15');
    harness.vendorid.set('vendor-1');
    harness.amount.set('100');
    harness.bcashid.set('bcash-1');
    harness.currencycode.set('INR');

    await component.submitForm(new Event('submit'));

    expect(localStorage.getItem(scopedLastBcashKey)).toBeNull();
  });
});
