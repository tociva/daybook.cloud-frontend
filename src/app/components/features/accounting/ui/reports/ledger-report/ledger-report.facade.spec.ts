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
  date: '2026-04-15',
  order: 1,
  debit: 10,
  credit: 0,
  oppositeLedgers: [],
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
    permissions = signal<readonly string[]>(options?.permissions ?? []);
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
        { provide: PermissionsStore, useValue: { all: permissions } },
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
        start: '2026-05-01',
        end: '2027-03-31',
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('clears report data and loads the ledger catalog when no ledger is selected', async () => {
    const facade = configure();
    facade.error.set('old error');
    facade.generatedAt.set('old generated');
    facade.tableRows.set([reportRow('old')]);

    await settle();

    expect(facade.error()).toBeNull();
    expect(facade.generatedAt()).toBe('');
    expect(facade.tableRows()).toEqual([]);
    expect(ledgerStore.ensureLedgerCatalogLoaded).toHaveBeenCalledWith(false);
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

  it('retries catalog loading after a failed catalog promise', async () => {
    const facade = configure();
    ledgerStore.ensureLedgerCatalogLoaded = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    ledgerError.set('catalog failed');

    await settle();
    expect(facade.error()).toBe('catalog failed');

    ledgerError.set(null);
    facade.onRefresh();
    await settle();

    expect(ledgerStore.ensureLedgerCatalogLoaded).toHaveBeenCalledTimes(2);
    expect(ledgerStore.ensureLedgerCatalogLoaded).toHaveBeenLastCalledWith(true);
    expect(facade.error()).toBeNull();
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
