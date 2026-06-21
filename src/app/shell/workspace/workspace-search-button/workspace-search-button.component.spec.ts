import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import Fuse from 'fuse.js';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { LedgerStore, type Ledger } from '../../../components/features/accounting/data/ledger';
import {
  LedgerCategoryStore,
  type LedgerCategory,
} from '../../../components/features/accounting/data/ledger-category';
import { CustomerStore, type Customer } from '../../../components/features/trading/data/customer';
import { VendorStore, type Vendor } from '../../../components/features/trading/data/vendor';
import { LedgerCachePreferencesStore } from '../../../core/preferences/ledger-cache-preferences.store';
import { FiscalYearDateRangeService } from '../../../shared/fiscal-year-date-range-picker';
import { SearchIndexService, type SearchEntry, type SearchIndex } from './search-index.service';
import { WorkspaceSearchButtonComponent } from './workspace-search-button.component';

type WorkspaceSearchButtonHarness = Readonly<{
  openPalette: (initialQuery?: string) => void;
  results: () => readonly { description: string; label: string; value?: string }[];
}>;

const staticEntries: readonly SearchEntry[] = [
  {
    title: 'List Sale Invoice',
    description: 'View and manage sale invoices.',
    keywords: ['list sale invoice', 'sale invoice', 'sales', 'billing'],
    url: '/app/trading/sale-invoice',
  },
];

function createStaticSearchIndex(entries: readonly SearchEntry[]): SearchIndex {
  return {
    entries,
    fuse: new Fuse(entries, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'keywords', weight: 1.5 },
        { name: 'description', weight: 1 },
      ],
      threshold: 0.35,
      includeScore: false,
      ignoreLocation: true,
    }),
  };
}

function customer(id: string, name: string): Customer {
  return {
    id,
    name,
    countrycode: 'US',
    currencycode: 'USD',
    address: { name, line1: 'Line 1' },
  };
}

function vendor(id: string, name: string): Vendor {
  return {
    id,
    name,
    countrycode: 'US',
    currencycode: 'USD',
    address: { name, line1: 'Line 1' },
  };
}

function ledger(id: string, name: string): Ledger {
  return {
    id,
    name,
    categoryid: 'category-id',
  };
}

function ledgerCategory(id: string, name: string): LedgerCategory {
  return {
    id,
    name,
  };
}

async function setup(options: {
  cacheEnabled?: boolean;
  catalogLoaded?: boolean;
  customers?: readonly Customer[];
  vendorCatalogLoaded?: boolean;
  vendors?: readonly Vendor[];
  ledgerCatalogLoaded?: boolean;
  ledgers?: readonly Ledger[];
  ledgerCategoryCatalogLoaded?: boolean;
  ledgerCategories?: readonly LedgerCategory[];
}): Promise<{
  component: WorkspaceSearchButtonHarness;
  ensureCustomerCatalogLoaded: ReturnType<typeof vi.fn>;
  ensureVendorCatalogLoaded: ReturnType<typeof vi.fn>;
  ensureLedgerCatalogLoaded: ReturnType<typeof vi.fn>;
  ensureLedgerCategoryCatalogLoaded: ReturnType<typeof vi.fn>;
}> {
  TestBed.resetTestingModule();

  const customerCatalog = signal(options.customers ?? []);
  const customerCatalogLoaded = signal(options.catalogLoaded ?? false);
  const vendorCatalog = signal(options.vendors ?? []);
  const vendorCatalogLoaded = signal(options.vendorCatalogLoaded ?? false);
  const ledgerCatalog = signal(options.ledgers ?? []);
  const ledgerCatalogLoaded = signal(options.ledgerCatalogLoaded ?? false);
  const ledgerCategoryCatalog = signal(options.ledgerCategories ?? []);
  const ledgerCategoryCatalogLoaded = signal(options.ledgerCategoryCatalogLoaded ?? false);
  const enabled = signal(options.cacheEnabled ?? true);
  const ensureCustomerCatalogLoaded = vi.fn(async () => true);
  const ensureVendorCatalogLoaded = vi.fn(async () => true);
  const ensureLedgerCatalogLoaded = vi.fn(async () => true);
  const ensureLedgerCategoryCatalogLoaded = vi.fn(async () => true);

  TestBed.configureTestingModule({
    imports: [WorkspaceSearchButtonComponent],
    providers: [
      provideRouter([]),
      {
        provide: SearchIndexService,
        useValue: { index$: of(createStaticSearchIndex(staticEntries)) },
      },
      {
        provide: CustomerStore,
        useValue: {
          catalog: customerCatalog,
          catalogLoaded: customerCatalogLoaded,
          ensureCustomerCatalogLoaded,
        },
      },
      {
        provide: VendorStore,
        useValue: {
          catalog: vendorCatalog,
          catalogLoaded: vendorCatalogLoaded,
          ensureVendorCatalogLoaded,
        },
      },
      {
        provide: LedgerStore,
        useValue: {
          catalog: ledgerCatalog,
          catalogLoaded: ledgerCatalogLoaded,
          ensureLedgerCatalogLoaded,
        },
      },
      {
        provide: LedgerCategoryStore,
        useValue: {
          catalog: ledgerCategoryCatalog,
          catalogLoaded: ledgerCategoryCatalogLoaded,
          ensureLedgerCategoryCatalogLoaded,
        },
      },
      {
        provide: FiscalYearDateRangeService,
        useValue: {
          range: signal({
            startdate: '2025-04-01',
            enddate: '2026-03-31',
            name: 'FY 2025-26',
          }),
        },
      },
      {
        provide: LedgerCachePreferencesStore,
        useValue: { enabled },
      },
    ],
  });
  TestBed.overrideComponent(WorkspaceSearchButtonComponent, {
    set: { imports: [], template: '' },
  });
  await TestBed.compileComponents();

  const fixture = TestBed.createComponent(WorkspaceSearchButtonComponent);
  return {
    component: fixture.componentInstance as unknown as WorkspaceSearchButtonHarness,
    ensureCustomerCatalogLoaded,
    ensureVendorCatalogLoaded,
    ensureLedgerCatalogLoaded,
    ensureLedgerCategoryCatalogLoaded,
  };
}

describe('WorkspaceSearchButtonComponent', () => {
  it('loads the customer, vendor, ledger, and ledger category catalogs when opening search with cache enabled', async () => {
    const {
      component,
      ensureCustomerCatalogLoaded,
      ensureVendorCatalogLoaded,
      ensureLedgerCatalogLoaded,
      ensureLedgerCategoryCatalogLoaded,
    } = await setup({
      cacheEnabled: true,
    });

    component.openPalette();

    expect(ensureCustomerCatalogLoaded).toHaveBeenCalledTimes(1);
    expect(ensureVendorCatalogLoaded).toHaveBeenCalledTimes(1);
    expect(ensureLedgerCatalogLoaded).toHaveBeenCalledTimes(1);
    expect(ensureLedgerCategoryCatalogLoaded).toHaveBeenCalledTimes(1);
  });

  it('does not load or show customer shortcuts when cache is disabled', async () => {
    const {
      component,
      ensureCustomerCatalogLoaded,
      ensureVendorCatalogLoaded,
      ensureLedgerCatalogLoaded,
      ensureLedgerCategoryCatalogLoaded,
    } = await setup({
      cacheEnabled: false,
      customers: [customer('spectrio', 'Spectrio LLC')],
      vendors: [vendor('acme', 'Acme Supplies')],
      ledgers: [ledger('cash-id', 'Cash')],
      ledgerCategories: [ledgerCategory('assets-id', 'Current Assets')],
    });

    component.openPalette('Spectrio');

    expect(ensureCustomerCatalogLoaded).not.toHaveBeenCalled();
    expect(ensureVendorCatalogLoaded).not.toHaveBeenCalled();
    expect(ensureLedgerCatalogLoaded).not.toHaveBeenCalled();
    expect(ensureLedgerCategoryCatalogLoaded).not.toHaveBeenCalled();
    expect(component.results()).toEqual([]);
  });

  it('appends matching customer shortcuts after static results for typed queries', async () => {
    const { component } = await setup({
      cacheEnabled: true,
      catalogLoaded: true,
      customers: [customer('sale-customer', 'Sale Customer')],
    });

    component.openPalette('Sale');

    expect(component.results().map((result) => result.label)).toEqual([
      'List Sale Invoice',
      'Sale Customer - Sale invoice list',
      'Sale Customer - Customer receipt list',
    ]);
  });

  it('appends matching vendor shortcuts for typed queries', async () => {
    const { component } = await setup({
      cacheEnabled: true,
      vendorCatalogLoaded: true,
      vendors: [vendor('acme', 'Acme Supplies')],
    });

    component.openPalette('Acme');

    expect(component.results().map((result) => result.label)).toEqual([
      'Acme Supplies - Purchase invoice list',
      'Acme Supplies - Vendor payment list',
    ]);
  });

  it('appends matching ledger report shortcuts for typed queries', async () => {
    const { component } = await setup({
      cacheEnabled: true,
      ledgerCatalogLoaded: true,
      ledgers: [ledger('3755f1d6-d1ef-4f76-855e-124094488908', 'Cash')],
    });

    component.openPalette('Cash');

    const results = component.results();
    expect(results.map((result) => result.label)).toEqual(['Cash - Ledger report']);

    const url = new URL(results[0]?.value ?? '', 'https://daybook.test');
    expect(url.pathname).toBe(
      '/app/accounting/reports/ledger/3755f1d6-d1ef-4f76-855e-124094488908',
    );
    expect(url.searchParams.get('start')).toBe('2025-04-01');
    expect(url.searchParams.get('end')).toBe('2026-03-31');
  });

  it('appends matching ledger category report shortcuts for typed queries', async () => {
    const { component } = await setup({
      cacheEnabled: true,
      ledgerCategoryCatalogLoaded: true,
      ledgerCategories: [ledgerCategory('271c5582-b401-4752-a828-47950f7b15e7', 'Current Assets')],
    });

    component.openPalette('Current Assets');

    const results = component.results();
    expect(results.map((result) => result.label)).toEqual([
      'Current Assets - Ledger category report',
    ]);

    const url = new URL(results[0]?.value ?? '', 'https://daybook.test');
    expect(url.pathname).toBe(
      '/app/accounting/reports/ledger-category/271c5582-b401-4752-a828-47950f7b15e7',
    );
    expect(url.searchParams.get('start')).toBe('2025-04-01');
    expect(url.searchParams.get('end')).toBe('2026-03-31');
  });

  it('does not show catalog shortcuts for empty queries', async () => {
    const { component } = await setup({
      cacheEnabled: true,
      catalogLoaded: true,
      customers: [customer('spectrio', 'Spectrio LLC')],
      vendorCatalogLoaded: true,
      vendors: [vendor('acme', 'Acme Supplies')],
      ledgerCatalogLoaded: true,
      ledgers: [ledger('cash-id', 'Cash')],
      ledgerCategoryCatalogLoaded: true,
      ledgerCategories: [ledgerCategory('assets-id', 'Current Assets')],
    });

    component.openPalette();

    expect(component.results().map((result) => result.label)).toEqual(['List Sale Invoice']);
  });
});
