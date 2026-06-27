import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import type { ParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';
import type {
  LedgerReport,
  LedgerReportRow,
  LedgerReportSummary,
} from '../../../data/ledger-report/ledger-report.model';
import { LedgerReportService } from '../../../data/ledger-report/ledger-report.service';
import { LedgerReportFacade } from './ledger-report.facade';

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

const emptySummary = (): LedgerReportSummary => ({
  openingDebit: 0,
  openingCredit: 0,
  runningDebit: 0,
  runningCredit: 0,
  closingDebit: 0,
  closingCredit: 0,
});

const reportRow = (journalid: string): LedgerReportRow => ({
  journalid,
  journalNumber: journalid,
  sourcetype: 'journal',
  date: '2026-04-15',
  order: 1,
  debit: 10,
  credit: 0,
  oppositeLedgers: [],
  runningDebit: 10,
  runningCredit: 0,
  balanceDebit: 10,
  balanceCredit: 0,
});

const report = (
  ledgerid: string,
  ledgerName: string,
  rows: readonly LedgerReportRow[] = [reportRow(ledgerid)],
): LedgerReport => ({
  title: 'Ledger Report',
  generatedAt: `generated-${ledgerid}`,
  ledger: {
    ledgerid,
    ledgerName,
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

describe('LedgerReportFacade', () => {
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
  let ledgerItems: ReturnType<typeof signal<readonly Ledger[]>>;
  let ledgerCatalog: ReturnType<typeof signal<readonly Ledger[]>>;
  let ledgerCount: ReturnType<typeof signal<number>>;
  let ledgerError: ReturnType<typeof signal<string | null>>;
  let ledgerStore: {
    catalog: typeof ledgerCatalog;
    count: typeof ledgerCount;
    ensureLedgerCatalogLoaded: ReturnType<typeof vi.fn>;
    error: typeof ledgerError;
    items: typeof ledgerItems;
    loadLedgers: ReturnType<typeof vi.fn>;
  };
  let permissions: ReturnType<typeof signal<readonly string[]>>;
  let fiscalYearRange: ReturnType<
    typeof signal<{
      enddate: string;
      name: string;
      startdate: string;
    } | null>
  >;
  let ledgerReportService: {
    getLedgerReport: ReturnType<typeof vi.fn>;
  };

  function configure(options?: {
    getLedgerReport?: ReturnType<typeof vi.fn>;
    ledgerid?: string | null;
    permissions?: readonly string[];
    query?: Record<string, string>;
  }): LedgerReportFacade {
    const query = options?.query ?? {
      start: '2026-04-01',
      end: '2027-03-31',
    };
    const params =
      options?.ledgerid === undefined || options.ledgerid === null
        ? {}
        : { ledgerid: options.ledgerid };

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
    ledgerCatalog = signal<readonly Ledger[]>([]);
    ledgerItems = signal<readonly Ledger[]>([]);
    ledgerCount = signal(0);
    ledgerError = signal<string | null>(null);
    ledgerStore = {
      catalog: ledgerCatalog,
      items: ledgerItems,
      count: ledgerCount,
      error: ledgerError,
      ensureLedgerCatalogLoaded: vi.fn(async () => true),
      loadLedgers: vi.fn(async () => undefined),
    };
    permissions = signal<readonly string[]>(
      options?.permissions ?? ['accountingReports.ledgerReport', 'journal.view'],
    );
    fiscalYearRange = signal({
      startdate: '2026-04-01',
      enddate: '2027-03-31',
      name: 'FY 2026-27',
    });
    ledgerReportService = {
      getLedgerReport:
        options?.getLedgerReport ?? vi.fn(async (ledgerid: string) => report(ledgerid, ledgerid)),
    };

    TestBed.configureTestingModule({
      providers: [
        LedgerReportFacade,
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: LedgerStore, useValue: ledgerStore },
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
        { provide: LedgerReportService, useValue: ledgerReportService },
      ],
    });

    return TestBed.inject(LedgerReportFacade);
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
      ledgerid: 'cash',
      query: {
        start: '2026-05-01',
        end: '2026-05-31',
      },
    });
    await settle();

    facade.openFilterPopover();

    expect(facade.draftLedgerId()).toBe('cash');
    expect(facade.draftDateOperator()).toBe('between');
    expect(facade.draftPickerValue()).toEqual({
      start: localDate(2026, 5, 1),
      end: localDate(2026, 5, 31),
    });
  });

  it('syncs draft single-date filters from the current route when the filter popover opens', async () => {
    const facade = configure({
      ledgerid: 'cash',
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
    const facade = configure({ ledgerid: 'cash' });
    await settle();
    router.navigate.mockClear();

    facade.openFilterPopover();
    facade.onDraftLedgerChange('bank');
    facade.onDraftDateRangeChange({
      start: localDate(2026, 6, 1),
      end: localDate(2026, 6, 30),
    });

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('applies staged filters with one navigation to the selected ledger and period', async () => {
    const facade = configure({ ledgerid: 'cash' });
    await settle();
    router.navigate.mockClear();

    facade.openFilterPopover();
    facade.onDraftLedgerChange('bank');
    facade.onDraftDateRangeChange({
      start: localDate(2026, 6, 1),
      end: localDate(2026, 6, 30),
    });
    facade.applyFilters();

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/app/accounting/reports/ledger', 'bank'], {
      queryParams: {
        dateOperator: 'between',
        start: '2026-06-01',
        end: '2026-06-30',
      },
    });
  });

  it('applies staged equal-to date filters with a single date in the route', async () => {
    const facade = configure({ ledgerid: 'cash' });
    await settle();
    router.navigate.mockClear();

    facade.openFilterPopover();
    facade.onDraftDateOperatorChange('eq');
    facade.onDraftSingleDateChange(localDate(2026, 6, 15));
    facade.applyFilters();

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/app/accounting/reports/ledger', 'cash'], {
      queryParams: {
        dateOperator: 'eq',
        start: '2026-06-15',
      },
    });
  });

  it('clears draft filters back to no ledger and the fiscal-year period', async () => {
    const facade = configure({
      ledgerid: 'cash',
      query: {
        start: '2026-05-01',
        end: '2026-05-31',
      },
    });
    await settle();

    facade.openFilterPopover();
    facade.clearFilters();

    expect(facade.draftLedgerId()).toBeNull();
    expect(facade.draftDateOperator()).toBe('between');
    expect(facade.draftPickerValue()).toEqual({
      start: localDate(2026, 4, 1),
      end: localDate(2027, 3, 31),
    });
  });

  it('clears report data and loads the ledger catalog when no ledger is selected', async () => {
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
    expect(facade.draftLedgerId()).toBeNull();
    expect(ledgerStore.ensureLedgerCatalogLoaded).toHaveBeenCalledWith(false);
  });

  it('resets draft ledger selection when the route has no ledgerid', async () => {
    const facade = configure({ ledgerid: 'cash' });
    await settle();

    facade.onDraftLedgerChange('bank');
    expect(facade.draftLedgerId()).toBe('bank');

    updateRoute({}, { start: '2026-04-01', end: '2027-03-31' });
    await settle();

    expect(facade.draftLedgerId()).toBeNull();
  });

  it('keeps empty-state draft ledger selection when the route effect re-runs without a ledger route change', async () => {
    const facade = configure();
    await settle();

    facade.onDraftLedgerChange('cash');
    expect(facade.draftLedgerId()).toBe('cash');

    updateRoute({}, { start: '2026-05-01', end: '2026-05-31' });
    await settle();

    expect(facade.draftLedgerId()).toBe('cash');
  });

  it('applies empty-state ledger selection with the current period query params', async () => {
    const facade = configure({
      query: {
        start: '2025-04-01',
        end: '2026-03-31',
      },
    });
    await settle();
    router.navigate.mockClear();

    facade.onDraftLedgerChange('cash');
    facade.applyLedgerSelection();

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/app/accounting/reports/ledger', 'cash'], {
      queryParams: {
        dateOperator: 'between',
        start: '2025-04-01',
        end: '2026-03-31',
      },
    });
  });

  it('applies empty-state ledger selection with the current date operator query params', async () => {
    const facade = configure({
      query: {
        dateOperator: 'ge',
        start: '2025-04-01',
      },
    });
    await settle();
    router.navigate.mockClear();

    facade.onDraftLedgerChange('cash');
    facade.applyLedgerSelection();

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/app/accounting/reports/ledger', 'cash'], {
      queryParams: {
        dateOperator: 'ge',
        start: '2025-04-01',
      },
    });
  });

  it('does not navigate when empty-state ledger selection has no ledger', async () => {
    const facade = configure();
    await settle();
    router.navigate.mockClear();

    facade.applyLedgerSelection();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('stores the report title from the API response', async () => {
    const facade = configure({ ledgerid: 'cash' });
    await settle();

    expect(facade.title()).toBe('Ledger Report');
  });

  it('returns an empty selected ledger name when no ledger is in the route', async () => {
    const facade = configure();
    await settle();

    expect(facade.selectedLedgerName()).toBe('');
  });

  it('resolves selected ledger name from the catalog while the report is loading', async () => {
    const getLedgerReport = vi.fn(() => deferred<LedgerReport>().promise);
    const facade = configure({ ledgerid: 'cash', getLedgerReport });
    ledgerCatalog.set([
      {
        id: 'cash',
        name: 'Cash Account',
        categoryid: 'assets',
      },
    ]);

    await settle();

    expect(facade.selectedLedgerName()).toBe('Cash Account');
  });

  it('resolves selected ledger name from the report after load', async () => {
    const facade = configure({
      ledgerid: 'cash',
      getLedgerReport: vi.fn(async () => report('cash', 'Cash Account')),
    });
    await settle();

    expect(facade.selectedLedgerName()).toBe('Cash Account');
  });

  it('shows the permission error and does not call the report API when permission is missing', async () => {
    const facade = configure({
      ledgerid: 'cash',
      permissions: ['accountingReports.trialBalance'],
    });

    await settle();

    expect(facade.error()).toBe('You do not have permission to view the ledger report.');
    expect(ledgerStore.loadLedgers).not.toHaveBeenCalled();
    expect(ledgerReportService.getLedgerReport).not.toHaveBeenCalled();
  });

  it('only applies the latest report response during rapid route changes', async () => {
    const cashReport = deferred<LedgerReport>();
    const bankReport = deferred<LedgerReport>();
    const getLedgerReport = vi.fn((ledgerid: string) =>
      ledgerid === 'cash' ? cashReport.promise : bankReport.promise,
    );
    const facade = configure({ ledgerid: 'cash', getLedgerReport });

    await settle();
    expect(ledgerReportService.getLedgerReport).toHaveBeenCalledWith('cash', {
      start: '2026-04-01',
      end: '2027-03-31',
    });

    updateRoute(
      { ledgerid: 'bank' },
      {
        start: '2026-05-01',
        end: '2026-05-31',
      },
    );
    await settle();

    bankReport.resolve(report('bank', 'Bank', [reportRow('bank-row')]));
    await settle();
    expect(facade.generatedAt()).toBe('generated-bank');
    expect(facade.tableRows().map((row) => row.journalid)).toEqual(['bank-row']);

    cashReport.resolve(report('cash', 'Cash', [reportRow('cash-row')]));
    await settle();
    expect(facade.generatedAt()).toBe('generated-bank');
    expect(facade.tableRows().map((row) => row.journalid)).toEqual(['bank-row']);
  });

  it('onRefresh reloads report without forcing catalog reload', async () => {
    const facade = configure({ ledgerid: 'cash' });
    await settle();

    const catalogCallsAfterBootstrap = ledgerStore.ensureLedgerCatalogLoaded.mock.calls.length;
    ledgerReportService.getLedgerReport.mockClear();

    facade.onRefresh();
    await settle();

    expect(ledgerReportService.getLedgerReport).toHaveBeenCalledTimes(1);
    expect(ledgerReportService.getLedgerReport).toHaveBeenCalledWith('cash', {
      start: '2026-04-01',
      end: '2027-03-31',
    });
    expect(ledgerStore.ensureLedgerCatalogLoaded.mock.calls.length).toBe(
      catalogCallsAfterBootstrap,
    );
    expect(ledgerStore.ensureLedgerCatalogLoaded).not.toHaveBeenCalledWith(true);
  });

  it('loads and refreshes greater-or-equal date filters as sparse API queries', async () => {
    const facade = configure({
      ledgerid: 'cash',
      query: {
        dateOperator: 'ge',
        start: '2026-05-01',
      },
    });
    await settle();

    expect(ledgerReportService.getLedgerReport).toHaveBeenCalledWith('cash', {
      start: '2026-05-01',
    });

    ledgerReportService.getLedgerReport.mockClear();
    facade.onRefresh();
    await settle();

    expect(ledgerReportService.getLedgerReport).toHaveBeenCalledWith('cash', {
      start: '2026-05-01',
    });
  });

  it('preserves date operator query params when opening an opposite ledger', async () => {
    const facade = configure({
      ledgerid: 'cash',
      query: {
        dateOperator: 'le',
        end: '2026-05-31',
      },
    });
    await settle();
    router.navigate.mockClear();

    facade.openOppositeLedger('bank');

    expect(router.navigate).toHaveBeenCalledWith(['/app/accounting/reports/ledger', 'bank'], {
      queryParams: {
        dateOperator: 'le',
        end: '2026-05-31',
      },
    });
  });

  it('preserves the selected ledger option from report metadata before the catalog contains it', async () => {
    const facade = configure({
      ledgerid: 'ghost',
      getLedgerReport: vi.fn(async () => report('ghost', 'Ghost Ledger', [reportRow('ghost-row')])),
    });

    await settle();

    expect(facade.autocompleteLedgers()).toEqual([
      {
        id: 'ghost',
        name: 'Ghost Ledger',
        categoryid: '',
      },
    ]);
  });
});
