import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import type { ParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';
import { LedgerCategoryStore } from '../../../data/ledger-category';
import type { LedgerCategory } from '../../../data/ledger-category';
import type {
  TrialBalanceItem,
  TrialBalanceReport,
} from '../../../data/trial-balance/trial-balance.model';
import { TrialBalanceService } from '../../../data/trial-balance/trial-balance.service';
import { TrialBalanceComponent } from './trial-balance.component';

type Deferred<T> = Readonly<{
  promise: Promise<T>;
  reject: (error: unknown) => void;
  resolve: (value: T) => void;
}>;

type TrialBalanceRow = Readonly<{
  children: readonly TrialBalanceRow[];
  key: string;
  kind: 'category' | 'ledger' | 'total';
  name: string;
}>;

type TrialBalanceHarness = Readonly<{
  displayError: () => string | null;
  generatedAt: () => string;
  onRefresh: () => void;
  trialBalanceTreeData: () => readonly TrialBalanceRow[];
}>;

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

const category = (id: string, name: string, parentid: string | null = null): LedgerCategory => ({
  id,
  name,
  parentid,
});

const ledger = (id: string, name: string, categoryid: string): Ledger => ({
  id,
  name,
  categoryid,
});

const balance = (ledgerid: string, name = ledgerid): TrialBalanceItem => ({
  ledgerid,
  name,
  openingDebit: 10,
  openingCredit: 0,
  runningDebit: 5,
  runningCredit: 0,
  closingDebit: 15,
  closingCredit: 0,
});

const report = (
  data: readonly TrialBalanceItem[] = [balance('cash', 'Cash from report')],
  generatedAt = 'generated-at',
): TrialBalanceReport => ({
  title: 'Trial Balance',
  generatedAt,
  data,
});

async function settle(): Promise<void> {
  for (let i = 0; i < 20; i += 1) {
    TestBed.flushEffects();
    await Promise.resolve();
  }
}

describe('TrialBalanceComponent', () => {
  let queryParamMap$: BehaviorSubject<ParamMap>;
  let route: {
    queryParamMap: BehaviorSubject<ParamMap>;
    snapshot: {
      queryParamMap: ParamMap;
    };
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let ledgerCatalog: ReturnType<typeof signal<readonly Ledger[]>>;
  let ledgerCatalogLoaded: ReturnType<typeof signal<boolean>>;
  let ledgerError: ReturnType<typeof signal<string | null>>;
  let ledgerIsLoading: ReturnType<typeof signal<boolean>>;
  let ledgerStore: {
    catalog: typeof ledgerCatalog;
    catalogLoaded: typeof ledgerCatalogLoaded;
    ensureLedgerCatalogLoaded: ReturnType<typeof vi.fn>;
    error: typeof ledgerError;
    isLoading: typeof ledgerIsLoading;
  };
  let categoryCatalog: ReturnType<typeof signal<readonly LedgerCategory[]>>;
  let categoryCatalogLoaded: ReturnType<typeof signal<boolean>>;
  let categoryError: ReturnType<typeof signal<string | null>>;
  let categoryIsLoading: ReturnType<typeof signal<boolean>>;
  let ledgerCategoryStore: {
    catalog: typeof categoryCatalog;
    catalogLoaded: typeof categoryCatalogLoaded;
    ensureLedgerCategoryCatalogLoaded: ReturnType<typeof vi.fn>;
    error: typeof categoryError;
    isLoading: typeof categoryIsLoading;
  };
  let fiscalYearRange: ReturnType<
    typeof signal<{
      enddate: string;
      name: string;
      startdate: string;
    } | null>
  >;
  let trialBalanceService: {
    getTrialBalance: ReturnType<typeof vi.fn>;
  };

  function configure(options?: {
    categoryEnsure?: ReturnType<typeof vi.fn>;
    categoryLoaded?: boolean;
    categoryRows?: readonly LedgerCategory[];
    getTrialBalance?: ReturnType<typeof vi.fn>;
    ledgerEnsure?: ReturnType<typeof vi.fn>;
    ledgerLoaded?: boolean;
    ledgerRows?: readonly Ledger[];
    query?: Record<string, string>;
  }): TrialBalanceHarness {
    queryParamMap$ = new BehaviorSubject(
      convertToParamMap(options?.query ?? { start: '2026-04-01', end: '2027-03-31' }),
    );
    route = {
      queryParamMap: queryParamMap$,
      snapshot: {
        queryParamMap: queryParamMap$.value,
      },
    };
    router = {
      navigate: vi.fn(() => Promise.resolve(true)),
    };

    ledgerCatalog = signal<readonly Ledger[]>(options?.ledgerRows ?? []);
    ledgerCatalogLoaded = signal(options?.ledgerLoaded ?? false);
    ledgerError = signal<string | null>(null);
    ledgerIsLoading = signal(false);
    ledgerStore = {
      catalog: ledgerCatalog,
      catalogLoaded: ledgerCatalogLoaded,
      error: ledgerError,
      isLoading: ledgerIsLoading,
      ensureLedgerCatalogLoaded:
        options?.ledgerEnsure ??
        vi.fn(async () => {
          ledgerCatalogLoaded.set(true);
          return true;
        }),
    };

    categoryCatalog = signal<readonly LedgerCategory[]>(options?.categoryRows ?? []);
    categoryCatalogLoaded = signal(options?.categoryLoaded ?? false);
    categoryError = signal<string | null>(null);
    categoryIsLoading = signal(false);
    ledgerCategoryStore = {
      catalog: categoryCatalog,
      catalogLoaded: categoryCatalogLoaded,
      error: categoryError,
      isLoading: categoryIsLoading,
      ensureLedgerCategoryCatalogLoaded:
        options?.categoryEnsure ??
        vi.fn(async () => {
          categoryCatalogLoaded.set(true);
          return true;
        }),
    };

    fiscalYearRange = signal({
      startdate: '2026-04-01',
      enddate: '2027-03-31',
      name: 'FY 2026-27',
    });
    trialBalanceService = {
      getTrialBalance: options?.getTrialBalance ?? vi.fn(async () => report()),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: LedgerStore, useValue: ledgerStore },
        { provide: LedgerCategoryStore, useValue: ledgerCategoryStore },
        { provide: TrialBalanceService, useValue: trialBalanceService },
        { provide: PermissionsStore, useValue: { all: signal<readonly string[]>([]) } },
        {
          provide: FiscalYearDateRangeService,
          useValue: {
            range: fiscalYearRange,
            toIsoDate: (value: Date) =>
              `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
                2,
                '0',
              )}-${String(value.getDate()).padStart(2, '0')}`,
          },
        },
        {
          provide: DateManagementService,
          useValue: {
            formatDisplayDateTime: vi.fn(
              (value: string | null | undefined, fallback: string) => value ?? fallback,
            ),
          },
        },
      ],
    });

    return TestBed.runInInjectionContext(
      () => new TrialBalanceComponent(),
    ) as unknown as TrialBalanceHarness;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('waits for ledger categories and ledgers before requesting the report', async () => {
    const categories = deferred<boolean>();
    const ledgers = deferred<boolean>();
    configure({
      categoryEnsure: vi.fn(() => categories.promise),
      ledgerEnsure: vi.fn(() => ledgers.promise),
    });

    await settle();
    expect(trialBalanceService.getTrialBalance).not.toHaveBeenCalled();

    categories.resolve(true);
    await settle();
    expect(trialBalanceService.getTrialBalance).not.toHaveBeenCalled();

    ledgers.resolve(true);
    await settle();

    expect(ledgerCategoryStore.ensureLedgerCategoryCatalogLoaded).toHaveBeenCalledWith(false);
    expect(ledgerStore.ensureLedgerCatalogLoaded).toHaveBeenCalledWith(false);
    expect(trialBalanceService.getTrialBalance).toHaveBeenCalledWith({
      start: '2026-04-01',
      end: '2027-03-31',
    });
  });

  it('keeps tree rows empty until both catalogs are loaded', async () => {
    const pendingCategoryLoad = deferred<boolean>();
    const component = configure({
      categoryLoaded: false,
      categoryEnsure: vi.fn(() => pendingCategoryLoad.promise),
      categoryRows: [category('asset', 'Asset')],
      ledgerLoaded: true,
      ledgerRows: [ledger('cash', 'Cash', 'asset')],
    });

    await settle();

    expect(component.trialBalanceTreeData()).toEqual([]);
  });

  it('groups ledgers under their category after both catalogs and report data load', async () => {
    const component = configure({
      categoryRows: [category('asset', 'Asset')],
      ledgerRows: [ledger('cash', 'Cash', 'asset')],
      getTrialBalance: vi.fn(async () => report([balance('cash', 'Cash from report')])),
    });

    await settle();

    const rows = component.trialBalanceTreeData();
    expect(rows.map((row) => row.name)).toEqual(['Asset', 'Total']);
    expect(rows[0]?.children.map((row) => row.name)).toEqual(['Cash']);
    expect(rows.some((row) => row.name === 'Uncategorized')).toBe(false);
  });

  it('shows a catalog error and does not fetch the report when reference data fails to load', async () => {
    const component = configure({
      categoryEnsure: vi.fn(async () => false),
      ledgerEnsure: vi.fn(async () => true),
    });
    categoryError.set('Failed to load ledger categories.');

    await settle();

    expect(component.displayError()).toBe('Failed to load ledger categories.');
    expect(trialBalanceService.getTrialBalance).not.toHaveBeenCalled();
    expect(component.trialBalanceTreeData()).toEqual([]);
  });

  it('ignores stale report responses from an earlier date range', async () => {
    const firstReport = deferred<TrialBalanceReport>();
    const secondReport = deferred<TrialBalanceReport>();
    const component = configure({
      getTrialBalance: vi
        .fn()
        .mockReturnValueOnce(firstReport.promise)
        .mockReturnValueOnce(secondReport.promise),
    });

    await settle();
    queryParamMap$.next(convertToParamMap({ start: '2026-05-01', end: '2027-03-31' }));
    route.snapshot.queryParamMap = queryParamMap$.value;
    await settle();

    secondReport.resolve(report([balance('cash', 'Latest Cash')], 'latest'));
    await settle();
    firstReport.resolve(report([balance('cash', 'Stale Cash')], 'stale'));
    await settle();

    expect(component.generatedAt()).toBe('latest');
  });

  it('routes manual refresh through the same reference-data gate', async () => {
    const categories = deferred<boolean>();
    const ledgers = deferred<boolean>();
    const component = configure({
      categoryEnsure: vi.fn(() => categories.promise),
      ledgerEnsure: vi.fn(() => ledgers.promise),
    });

    await settle();
    component.onRefresh();
    await settle();

    expect(ledgerCategoryStore.ensureLedgerCategoryCatalogLoaded).toHaveBeenCalledTimes(1);
    expect(ledgerStore.ensureLedgerCatalogLoaded).toHaveBeenCalledTimes(1);
    expect(trialBalanceService.getTrialBalance).not.toHaveBeenCalled();

    categories.resolve(true);
    ledgers.resolve(true);
    await settle();

    expect(trialBalanceService.getTrialBalance).toHaveBeenCalledTimes(1);
  });
});
