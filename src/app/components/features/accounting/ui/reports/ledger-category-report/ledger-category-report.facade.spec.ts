import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import type { ParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { LedgerCategoryStore } from '../../../data/ledger-category';
import type { LedgerCategory } from '../../../data/ledger-category';
import type {
  LedgerCategoryReport,
  LedgerCategoryReportRow,
  LedgerCategoryReportSummary,
} from '../../../data/ledger-category-report/ledger-category-report.model';
import { LedgerCategoryReportService } from '../../../data/ledger-category-report/ledger-category-report.service';
import { LedgerCategoryReportFacade } from './ledger-category-report.facade';

type Deferred<T> = Readonly<{
  promise: Promise<T>;
  reject: (error: unknown) => void;
  resolve: (value: T) => void;
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

const emptySummary = (): LedgerCategoryReportSummary => ({
  openingDebit: 0,
  openingCredit: 0,
  runningDebit: 0,
  runningCredit: 0,
  closingDebit: 0,
  closingCredit: 0,
});

const reportRow = (journalid: string): LedgerCategoryReportRow => ({
  journalid,
  journalNumber: journalid,
  sourcetype: 'journal',
  date: '2026-04-15',
  order: 1,
  ledgerid: 'ledger-1',
  ledgerName: 'Ledger 1',
  ledgercategoryid: 'bank',
  ledgerCategoryName: 'Bank Accounts',
  debit: 10,
  credit: 0,
  oppositeLedgers: [],
  runningDebit: 10,
  runningCredit: 0,
  balanceDebit: 10,
  balanceCredit: 0,
});

const report = (
  ledgercategoryid: string,
  ledgerCategoryName: string,
  rows: readonly LedgerCategoryReportRow[] = [reportRow(ledgercategoryid)],
): LedgerCategoryReport => ({
  title: 'Ledger Category Report',
  generatedAt: `generated-${ledgercategoryid}`,
  ledgerCategory: {
    ledgercategoryid,
    ledgerCategoryName,
  },
  summary: emptySummary(),
  data: rows,
});

const localDate = (year: number, month: number, day: number): Date =>
  new Date(year, month - 1, day);

async function settle(): Promise<void> {
  for (let i = 0; i < 20; i += 1) {
    TestBed.flushEffects();
    await Promise.resolve();
  }
}

describe('LedgerCategoryReportFacade', () => {
  let queryParamMap$: BehaviorSubject<ParamMap>;
  let paramMap$: BehaviorSubject<ParamMap>;
  let route: {
    paramMap: BehaviorSubject<ParamMap>;
    queryParamMap: BehaviorSubject<ParamMap>;
    snapshot: {
      paramMap: ParamMap;
      queryParamMap: ParamMap;
    };
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let categoryItems: ReturnType<typeof signal<readonly LedgerCategory[]>>;
  let categoryCatalog: ReturnType<typeof signal<readonly LedgerCategory[]>>;
  let categoryCount: ReturnType<typeof signal<number>>;
  let categoryError: ReturnType<typeof signal<string | null>>;
  let ledgerCategoryStore: {
    catalog: typeof categoryCatalog;
    count: typeof categoryCount;
    error: typeof categoryError;
    ensureLedgerCategoryCatalogLoaded: ReturnType<typeof vi.fn>;
    items: typeof categoryItems;
    loadLedgerCategories: ReturnType<typeof vi.fn>;
  };
  let permissions: ReturnType<typeof signal<readonly string[]>>;
  let fiscalYearRange: ReturnType<
    typeof signal<{
      enddate: string;
      name: string;
      startdate: string;
    } | null>
  >;
  let ledgerCategoryReportService: {
    getLedgerCategoryReport: ReturnType<typeof vi.fn>;
  };

  function configure(options?: {
    getLedgerCategoryReport?: ReturnType<typeof vi.fn>;
    ledgercategoryid?: string | null;
    permissions?: readonly string[];
    query?: Record<string, string>;
  }): LedgerCategoryReportFacade {
    const query = options?.query ?? {
      start: '2026-04-01',
      end: '2027-03-31',
    };
    const params =
      options?.ledgercategoryid === undefined || options?.ledgercategoryid === null
        ? {}
        : { ledgercategoryid: options.ledgercategoryid };

    queryParamMap$ = new BehaviorSubject(convertToParamMap(query));
    paramMap$ = new BehaviorSubject(convertToParamMap(params));
    route = {
      queryParamMap: queryParamMap$,
      paramMap: paramMap$,
      snapshot: {
        queryParamMap: queryParamMap$.value,
        paramMap: paramMap$.value,
      },
    };
    router = {
      navigate: vi.fn(() => Promise.resolve(true)),
    };
    categoryItems = signal<readonly LedgerCategory[]>([]);
    categoryCatalog = signal<readonly LedgerCategory[]>([]);
    categoryCount = signal(0);
    categoryError = signal<string | null>(null);
    ledgerCategoryStore = {
      catalog: categoryCatalog,
      items: categoryItems,
      count: categoryCount,
      error: categoryError,
      ensureLedgerCategoryCatalogLoaded: vi.fn(async () => true),
      loadLedgerCategories: vi.fn(async () => undefined),
    };
    permissions = signal<readonly string[]>(
      options?.permissions ?? [
        'accountingReports.ledgerCategoryReport',
        'accountingReports.ledgerReport',
        'journal.view',
      ],
    );
    fiscalYearRange = signal({
      startdate: '2026-04-01',
      enddate: '2027-03-31',
      name: 'FY 2026-27',
    });
    ledgerCategoryReportService = {
      getLedgerCategoryReport:
        options?.getLedgerCategoryReport ??
        vi.fn(async (ledgercategoryid: string) =>
          report(ledgercategoryid, ledgercategoryid, [reportRow(ledgercategoryid)]),
        ),
    };

    TestBed.configureTestingModule({
      providers: [
        LedgerCategoryReportFacade,
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: LedgerCategoryStore, useValue: ledgerCategoryStore },
        {
          provide: PermissionsStore,
          useValue: {
            can: (requirement: { resource?: string; action?: string }) =>
              permissions().includes(`${requirement.resource}.${requirement.action}`),
          },
        },
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
        { provide: LedgerCategoryReportService, useValue: ledgerCategoryReportService },
      ],
    });

    return TestBed.inject(LedgerCategoryReportFacade);
  }

  function updateRoute(params: Record<string, string>, query?: Record<string, string>): void {
    paramMap$.next(convertToParamMap(params));
    route.snapshot.paramMap = paramMap$.value;
    if (query) {
      queryParamMap$.next(convertToParamMap(query));
      route.snapshot.queryParamMap = queryParamMap$.value;
    }
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('seeds missing start/end query params from the fiscal year range with replaceUrl', async () => {
    configure({
      query: {
        start: '2026-05-01',
      },
    });

    await settle();

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: {
        dateOperator: 'between',
        start: '2026-05-01',
        end: '2027-03-31',
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('does not seed a missing end date for greater-or-equal date filters', async () => {
    configure({
      query: {
        dateOperator: 'ge',
        start: '2026-05-01',
      },
    });

    await settle();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('syncs draft filters from the current route when the filter popover opens', async () => {
    const facade = configure({
      ledgercategoryid: 'bank',
      query: {
        start: '2026-05-01',
        end: '2026-05-31',
      },
    });
    await settle();

    facade.openFilterPopover();

    expect(facade.draftCategoryId()).toBe('bank');
    expect(facade.draftDateOperator()).toBe('between');
    expect(facade.draftPickerValue()).toEqual({
      start: localDate(2026, 5, 1),
      end: localDate(2026, 5, 31),
    });
  });

  it('syncs draft single-date filters from the current route when the filter popover opens', async () => {
    const facade = configure({
      ledgercategoryid: 'bank',
      query: {
        dateOperator: '=',
        start: '2026-05-01',
      },
    });
    await settle();

    facade.openFilterPopover();

    expect(facade.draftDateOperator()).toBe('eq');
    expect(facade.draftSingleDate()).toEqual(localDate(2026, 5, 1));
    expect(facade.draftPickerValue()).toEqual({
      start: localDate(2026, 5, 1),
      end: localDate(2026, 5, 1),
    });
  });

  it('does not navigate while draft filter values are changing', async () => {
    const facade = configure({ ledgercategoryid: 'bank' });
    await settle();
    router.navigate.mockClear();

    facade.openFilterPopover();
    facade.onDraftCategoryChange('cash');
    facade.onDraftDateRangeChange({
      start: localDate(2026, 6, 1),
      end: localDate(2026, 6, 30),
    });

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('applies staged filters with one navigation to the selected category and period', async () => {
    const facade = configure({ ledgercategoryid: 'bank' });
    await settle();
    router.navigate.mockClear();

    facade.openFilterPopover();
    facade.onDraftCategoryChange('cash');
    facade.onDraftDateRangeChange({
      start: localDate(2026, 6, 1),
      end: localDate(2026, 6, 30),
    });
    facade.applyFilters();

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/app/accounting/reports/ledger-category', 'cash'],
      {
        queryParams: {
          dateOperator: 'between',
          start: '2026-06-01',
          end: '2026-06-30',
        },
      },
    );
  });

  it('applies staged equal-to date filters with a single date in the route', async () => {
    const facade = configure({ ledgercategoryid: 'bank' });
    await settle();
    router.navigate.mockClear();

    facade.openFilterPopover();
    facade.onDraftDateOperatorChange('eq');
    facade.onDraftSingleDateChange(localDate(2026, 6, 15));
    facade.applyFilters();

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/app/accounting/reports/ledger-category', 'bank'],
      {
        queryParams: {
          dateOperator: 'eq',
          start: '2026-06-15',
        },
      },
    );
  });

  it('clears draft filters back to no category and the fiscal-year period', async () => {
    const facade = configure({
      ledgercategoryid: 'bank',
      query: {
        start: '2026-05-01',
        end: '2026-05-31',
      },
    });
    await settle();

    facade.openFilterPopover();
    facade.clearFilters();

    expect(facade.draftCategoryId()).toBeNull();
    expect(facade.draftDateOperator()).toBe('between');
    expect(facade.draftPickerValue()).toEqual({
      start: localDate(2026, 4, 1),
      end: localDate(2027, 3, 31),
    });
  });

  it('clears report data and loads the category catalog when no category is selected', async () => {
    const facade = configure();
    facade.error.set('old error');
    facade.title.set('old title');
    facade.generatedAt.set('old generated');
    facade.tableRows.set([reportRow('old')]);

    await settle();

    expect(facade.error()).toBeNull();
    expect(facade.title()).toBe('');
    expect(facade.generatedAt()).toBe('');
    expect(facade.tableRows()).toEqual([]);
    expect(facade.draftCategoryId()).toBeNull();
    expect(ledgerCategoryStore.ensureLedgerCategoryCatalogLoaded).toHaveBeenCalledWith(false);
  });

  it('resets draft category selection when the route has no ledgercategoryid', async () => {
    const facade = configure({ ledgercategoryid: 'bank' });
    await settle();

    facade.onDraftCategoryChange('cash');
    expect(facade.draftCategoryId()).toBe('cash');

    updateRoute({}, { start: '2026-04-01', end: '2027-03-31' });
    await settle();

    expect(facade.draftCategoryId()).toBeNull();
  });

  it('keeps empty-state draft category selection when the route effect re-runs without a category route change', async () => {
    const facade = configure();
    await settle();

    facade.onDraftCategoryChange('bank');
    expect(facade.draftCategoryId()).toBe('bank');

    updateRoute({}, { start: '2026-05-01', end: '2026-05-31' });
    await settle();

    expect(facade.draftCategoryId()).toBe('bank');
  });

  it('applies empty-state category selection with the current period query params', async () => {
    const facade = configure({
      query: {
        start: '2025-04-01',
        end: '2026-03-31',
      },
    });
    await settle();
    router.navigate.mockClear();

    facade.onDraftCategoryChange('bank');
    facade.applyCategorySelection();

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/app/accounting/reports/ledger-category', 'bank'],
      {
        queryParams: {
          dateOperator: 'between',
          start: '2025-04-01',
          end: '2026-03-31',
        },
      },
    );
  });

  it('applies empty-state category selection with the current date operator query params', async () => {
    const facade = configure({
      query: {
        dateOperator: 'ge',
        start: '2025-04-01',
      },
    });
    await settle();
    router.navigate.mockClear();

    facade.onDraftCategoryChange('bank');
    facade.applyCategorySelection();

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/app/accounting/reports/ledger-category', 'bank'],
      {
        queryParams: {
          dateOperator: 'ge',
          start: '2025-04-01',
        },
      },
    );
  });

  it('does not navigate when empty-state category selection has no category', async () => {
    const facade = configure();
    await settle();
    router.navigate.mockClear();

    facade.applyCategorySelection();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('stores the report title from the API response', async () => {
    const facade = configure({ ledgercategoryid: 'bank' });
    await settle();

    expect(facade.title()).toBe('Ledger Category Report');
  });

  it('returns an empty selected category name when no category is in the route', async () => {
    const facade = configure();
    await settle();

    expect(facade.selectedCategoryName()).toBe('');
  });

  it('resolves selected category name from the catalog while the report is loading', async () => {
    const getLedgerCategoryReport = vi.fn(() => deferred<LedgerCategoryReport>().promise);
    const facade = configure({ ledgercategoryid: 'bank', getLedgerCategoryReport });
    categoryCatalog.set([
      {
        id: 'bank',
        name: 'Bank Accounts',
      },
    ]);

    await settle();

    expect(facade.selectedCategoryName()).toBe('Bank Accounts');
  });

  it('resolves selected category name from the report after load', async () => {
    const facade = configure({
      ledgercategoryid: 'bank',
      getLedgerCategoryReport: vi.fn(async () => report('bank', 'Bank Accounts')),
    });
    await settle();

    expect(facade.selectedCategoryName()).toBe('Bank Accounts');
  });

  it('shows the permission error and does not call the report API when permission is missing', async () => {
    const facade = configure({
      ledgercategoryid: 'bank',
      permissions: ['accountingReports.trialBalance'],
    });

    await settle();

    expect(facade.error()).toBe('You do not have permission to view the ledger category report.');
    expect(ledgerCategoryStore.ensureLedgerCategoryCatalogLoaded).not.toHaveBeenCalled();
    expect(ledgerCategoryReportService.getLedgerCategoryReport).not.toHaveBeenCalled();
  });

  it('only applies the latest report response during rapid route changes', async () => {
    const bankReport = deferred<LedgerCategoryReport>();
    const cashReport = deferred<LedgerCategoryReport>();
    const getLedgerCategoryReport = vi.fn((ledgercategoryid: string) =>
      ledgercategoryid === 'bank' ? bankReport.promise : cashReport.promise,
    );
    const facade = configure({ ledgercategoryid: 'bank', getLedgerCategoryReport });

    await settle();
    expect(ledgerCategoryReportService.getLedgerCategoryReport).toHaveBeenCalledWith('bank', {
      start: '2026-04-01',
      end: '2027-03-31',
    });

    updateRoute(
      { ledgercategoryid: 'cash' },
      {
        start: '2026-05-01',
        end: '2026-05-31',
      },
    );
    await settle();

    cashReport.resolve(report('cash', 'Cash', [reportRow('cash-row')]));
    await settle();
    expect(facade.generatedAt()).toBe('generated-cash');
    expect(facade.tableRows().map((row) => row.journalid)).toEqual(['cash-row']);

    bankReport.resolve(report('bank', 'Bank', [reportRow('bank-row')]));
    await settle();
    expect(facade.generatedAt()).toBe('generated-cash');
    expect(facade.tableRows().map((row) => row.journalid)).toEqual(['cash-row']);
  });

  it('onRefresh reloads report without forcing catalog reload', async () => {
    const facade = configure({ ledgercategoryid: 'bank' });
    await settle();

    const catalogCallsAfterBootstrap =
      ledgerCategoryStore.ensureLedgerCategoryCatalogLoaded.mock.calls.length;
    ledgerCategoryReportService.getLedgerCategoryReport.mockClear();

    facade.onRefresh();
    await settle();

    expect(ledgerCategoryReportService.getLedgerCategoryReport).toHaveBeenCalledTimes(1);
    expect(ledgerCategoryReportService.getLedgerCategoryReport).toHaveBeenCalledWith('bank', {
      start: '2026-04-01',
      end: '2027-03-31',
    });
    expect(ledgerCategoryStore.ensureLedgerCategoryCatalogLoaded.mock.calls.length).toBe(
      catalogCallsAfterBootstrap,
    );
    expect(ledgerCategoryStore.ensureLedgerCategoryCatalogLoaded).not.toHaveBeenCalledWith(true);
  });

  it('loads and refreshes greater-or-equal date filters as sparse API queries', async () => {
    const facade = configure({
      ledgercategoryid: 'bank',
      query: {
        dateOperator: 'ge',
        start: '2026-05-01',
      },
    });
    await settle();

    expect(ledgerCategoryReportService.getLedgerCategoryReport).toHaveBeenCalledWith('bank', {
      start: '2026-05-01',
    });

    ledgerCategoryReportService.getLedgerCategoryReport.mockClear();
    facade.onRefresh();
    await settle();

    expect(ledgerCategoryReportService.getLedgerCategoryReport).toHaveBeenCalledWith('bank', {
      start: '2026-05-01',
    });
  });

  it('preserves date operator query params when opening a ledger report', async () => {
    const facade = configure({
      ledgercategoryid: 'bank',
      query: {
        dateOperator: 'le',
        end: '2026-05-31',
      },
    });
    await settle();
    router.navigate.mockClear();

    facade.openRowLedger('cash');

    expect(router.navigate).toHaveBeenCalledWith(['/app/accounting/reports/ledger', 'cash'], {
      queryParams: {
        dateOperator: 'le',
        end: '2026-05-31',
      },
    });
  });

  it('preserves the selected category option from report metadata before the catalog contains it', async () => {
    const facade = configure({
      ledgercategoryid: 'ghost',
      getLedgerCategoryReport: vi.fn(async () =>
        report('ghost', 'Ghost Category', [reportRow('ghost-row')]),
      ),
    });

    await settle();

    expect(facade.autocompleteCategories()).toEqual([
      {
        id: 'ghost',
        name: 'Ghost Category',
      },
    ]);
  });
});
