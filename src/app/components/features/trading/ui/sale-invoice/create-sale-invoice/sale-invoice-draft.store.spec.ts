import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import type { UserSession } from '../../../../management/data/user-session/user-session.model';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import type { Customer } from '../../../data/customer';
import { CustomerStore } from '../../../data/customer';
import type { Item } from '../../../data/item';
import { ItemStore } from '../../../data/item';
import { ItemCategoryStore } from '../../../data/item-category';
import type { SaleInvoice } from '../../../data/sale-invoice';
import { TaxStore } from '../../../data/tax';
import { TaxGroupStore } from '../../../data/tax-group';
import { SaleInvoiceDraftStore } from './sale-invoice-draft.store';

const selectedCustomer: Customer = {
  id: 'customer-selected',
  name: 'Selected Customer',
  countrycode: 'IN',
  currencycode: 'INR',
  gstin: '29SELECTED1234Z5',
  address: { name: 'Selected Customer', line1: 'Selected line' },
};

const gstCustomer: Customer = {
  id: 'customer-gst',
  name: 'GST Customer',
  countrycode: 'IN',
  currencycode: 'INR',
  gstin: '29ABCDE1234F1Z5',
  address: { name: 'GST Customer', line1: 'GST line' },
};

const foreignCurrencyCustomer: Customer = {
  id: 'customer-foreign',
  name: 'Foreign Customer',
  countrycode: 'US',
  currencycode: 'USD',
  address: { name: 'Foreign Customer', line1: 'Foreign line' },
};

type ConfigureOptions = Readonly<{
  defaultDate?: (value?: string) => string;
  session?: UserSession | null;
  toIsoDate?: (value: unknown) => string | null;
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

const scopedLastDateKey = 'daybook:sale-invoice:last-date:user-1:org-1:branch-1:fy-1';

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

describe('SaleInvoiceDraftStore', () => {
  function configure(
    customers: readonly Customer[] = [],
    storeSelectedCustomer: Customer | null = null,
    branchCurrencyCode = '',
    options: ConfigureOptions = {},
  ) {
    const session = signal<UserSession | null>(
      options.session !== undefined
        ? options.session
        : branchCurrencyCode
        ? ({
            name: '',
            email: '',
            userid: '',
            member: null,
            memberorgs: [],
            branch: { currencycode: branchCurrencyCode },
          } as unknown as UserSession)
        : null,
    );
    const defaultDate = vi.fn(options.defaultDate ?? ((value?: string) => value || '2026-04-01'));
    const toIsoDate = vi.fn(
      options.toIsoDate ??
        ((value: unknown) =>
          typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null),
    );

    TestBed.configureTestingModule({
      providers: [
        SaleInvoiceDraftStore,
        {
          provide: CustomerStore,
          useValue: {
            items: vi.fn(() => customers),
            selectedItem: vi.fn(() => storeSelectedCustomer),
          },
        },
        { provide: ItemStore, useValue: { items: vi.fn(() => []) } },
        { provide: ItemCategoryStore, useValue: {} },
        { provide: TaxGroupStore, useValue: { catalog: vi.fn(() => []) } },
        { provide: TaxStore, useValue: { catalog: vi.fn(() => []), loadTaxById: vi.fn() } },
        { provide: UserSessionStore, useValue: { session } },
        {
          provide: FiscalYearDateRangeService,
          useValue: {
            defaultDate,
            errorMessage: vi.fn(() => null),
            range: signal(null),
            toIsoDate,
          },
        },
      ],
    });

    return TestBed.inject(SaleInvoiceDraftStore);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    installLocalStorageMock();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('remembers the current invoice date in scoped local storage', () => {
    const draft = configure([], null, '', { session: scopedSession });

    draft.date.set('2026-06-15');
    draft.rememberInvoiceDate();

    expect(localStorage.getItem(scopedLastDateKey)).toBe('2026-06-15');
  });

  it('applies the remembered invoice date and recalculates the due date', () => {
    localStorage.setItem(scopedLastDateKey, '2026-05-02');
    const draft = configure([], null, '', { session: scopedSession });

    draft.date.set('2026-04-01');
    draft.duedate.set('2026-04-15');
    draft.applyRememberedInvoiceDate();

    expect(draft.date()).toBe('2026-05-02');
    expect(draft.duedate()).toBe('2026-05-16');
  });

  it('ignores invalid remembered invoice dates', () => {
    localStorage.setItem(scopedLastDateKey, 'not-a-date');
    const draft = configure([], null, '', { session: scopedSession });

    draft.date.set('2026-04-01');
    draft.duedate.set('2026-04-15');
    draft.applyRememberedInvoiceDate();

    expect(draft.date()).toBe('2026-04-01');
    expect(draft.duedate()).toBe('2026-04-15');
  });

  it('constrains remembered invoice dates through the fiscal year date service', () => {
    localStorage.setItem(scopedLastDateKey, '2027-05-01');
    const draft = configure([], null, '', {
      defaultDate: (value?: string) => {
        if (!value) return '2026-04-01';
        return value > '2027-03-31' ? '2027-03-31' : value;
      },
      session: scopedSession,
    });

    draft.applyRememberedInvoiceDate();

    expect(draft.date()).toBe('2027-03-31');
    expect(draft.duedate()).toBe('2027-04-14');
  });

  it('keeps the explicitly selected customer when partyId is present', () => {
    const draft = configure([], selectedCustomer);

    draft.patchFromGstReconciliation(
      convertToParamMap({
        partyId: 'customer-selected',
        partyName: 'GST Portal Name',
        partyGstin: '29PORTAL1234F1Z5',
      }),
    );

    expect(draft.customerid()).toBe('customer-selected');
    expect(draft.selectedCustomer()).toBe(selectedCustomer);
    expect(draft.customerSearch()).toBe('Selected Customer');
  });

  it('falls back to GSTIN matching when partyId is missing', () => {
    const draft = configure([gstCustomer]);

    draft.patchFromGstReconciliation(
      convertToParamMap({
        partyName: 'GST Portal Name',
        partyGstin: '29ABCDE1234F1Z5',
      }),
    );

    expect(draft.customerid()).toBe('customer-gst');
    expect(draft.selectedCustomer()).toBe(gstCustomer);
  });

  it('sets tax option to Export when selected customer currency differs from branch currency', () => {
    const draft = configure([], null, 'INR');

    draft.selectCustomer(foreignCurrencyCustomer);

    expect(draft.currencycode()).toBe('USD');
    expect(draft.taxoption()).toBe('Export');
  });

  it('keeps the current tax option when selected customer currency matches branch currency', () => {
    const draft = configure([], null, 'INR');
    draft.taxoption.set('Inter State');

    draft.selectCustomer(selectedCustomer);

    expect(draft.currencycode()).toBe('INR');
    expect(draft.taxoption()).toBe('Inter State');
  });

  it('rounds row amounts before computing the invoice grand total', () => {
    const draft = configure();

    draft.items.set([
      {
        item: null,
        itemid: 'item-1',
        name: 'Taxed item',
        displayname: 'Taxed item',
        code: '',
        price: 5553.245,
        quantity1: 1,
        quantity2: 1,
        itemtotal: 0,
        discpercent: 0,
        discamount: 0,
        subtotal: 0,
        taxamount: 0,
        grandtotal: 0,
        description: '',
        taxes: [
          {
            taxid: 'tax-18',
            name: 'GST',
            shortname: 'GST',
            rate: 18,
            appliedto: 100,
            amount: 0,
          },
        ],
      },
    ]);
    draft.roundoff.set('-0.01');

    draft.recalcRow(0);

    expect(draft.itemtotal()).toBe('5553.25');
    expect(draft.tax()).toBe('999.59');
    expect(draft.grandtotal()).toBe('6552.83');
  });

  it('seeds the editable display name when selecting an item', async () => {
    const draft = configure();
    const item: Item = {
      id: 'item-1',
      name: 'Internal item name',
      displayname: 'Customer facing name',
      code: 'ITM-1',
      categoryid: '',
    };

    await draft.selectItem(item, 0);

    expect(draft.items()[0].name).toBe('Internal item name');
    expect(draft.items()[0].displayname).toBe('Customer facing name');
  });

  it('updates only the invoice row display name override', () => {
    const draft = configure();
    const item: Item = {
      id: 'item-1',
      name: 'Internal item name',
      displayname: 'Customer facing name',
      code: 'ITM-1',
      categoryid: '',
    };
    draft.items.set([
      {
        ...draft.items()[0],
        item,
        itemid: 'item-1',
        name: item.name,
        displayname: item.displayname,
        code: item.code ?? '',
      },
    ]);

    draft.updateItemDisplayName(0, 'Invoice custom name');

    expect(draft.items()[0].displayname).toBe('Invoice custom name');
    expect(draft.items()[0].name).toBe('Internal item name');
    expect(draft.items()[0].item?.displayname).toBe('Customer facing name');
  });

  it('keeps show display name and row display names across draft save and restore', () => {
    const draft = configure();
    draft.showDisplayName.set(true);
    draft.updateItemDisplayName(0, 'Restored display name');

    draft.saveDraft(0);
    const snapshot = draft.restoreAndClearDraft();
    expect(snapshot).not.toBeNull();

    draft.showDisplayName.set(false);
    draft.updateItemDisplayName(0, '');
    draft.applySnapshot(snapshot!);

    expect(draft.showDisplayName()).toBe(true);
    expect(draft.items()[0].displayname).toBe('Restored display name');
  });

  it('preserves loaded invoice item display names', () => {
    const draft = configure();

    draft.patchFromInvoice({
      number: 'SI-1',
      date: '2026-04-01',
      duedate: '2026-04-15',
      currencycode: 'INR',
      customerid: 'customer-1',
      cprops: { showdisplayname: true },
      billingaddress: { name: 'Customer', line1: 'Billing line' },
      shippingaddress: { name: 'Customer', line1: 'Shipping line' },
      roundoff: 0,
      items: [
        {
          name: 'Internal item name',
          displayname: 'Saved invoice display name',
          description: '',
          order: 1,
          code: 'ITM-1',
          price: 100,
          quantity: 1,
          itemtotal: 100,
          subtotal: 100,
          taxes: [],
          taxamount: 0,
          grandtotal: 100,
          itemid: 'item-1',
        },
      ],
    } satisfies SaleInvoice);

    expect(draft.showDisplayName()).toBe(true);
    expect(draft.items()[0].displayname).toBe('Saved invoice display name');
  });

  it('loads invoice items in ascending order', () => {
    const draft = configure();

    draft.patchFromInvoice({
      number: 'SI-2',
      date: '2026-04-01',
      duedate: '2026-04-15',
      currencycode: 'INR',
      customerid: 'customer-1',
      billingaddress: { name: 'Customer', line1: 'Billing line' },
      shippingaddress: { name: 'Customer', line1: 'Shipping line' },
      roundoff: 0,
      items: [
        {
          name: 'Third item',
          order: 3,
          code: 'ITM-3',
          price: 300,
          quantity: 1,
          itemtotal: 300,
          subtotal: 300,
          taxes: [],
          grandtotal: 300,
          itemid: 'item-3',
        },
        {
          name: 'First item',
          order: 1,
          code: 'ITM-1',
          price: 100,
          quantity: 1,
          itemtotal: 100,
          subtotal: 100,
          taxes: [],
          grandtotal: 100,
          itemid: 'item-1',
        },
        {
          name: 'Second item',
          order: 2,
          code: 'ITM-2',
          price: 200,
          quantity: 1,
          itemtotal: 200,
          subtotal: 200,
          taxes: [],
          grandtotal: 200,
          itemid: 'item-2',
        },
      ],
    } satisfies SaleInvoice);

    expect(draft.items().map((item) => item.name)).toEqual([
      'First item',
      'Second item',
      'Third item',
    ]);
  });
});
