import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import type { ParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { DatepickerDateAdapterService } from '../../../../../../core/date/datepicker-date-adapter.service';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import type { TaxReportResponse } from '../../../data/tax-report/tax-report.model';
import { TaxReportService } from '../../../data/tax-report/tax-report.service';
import { TaxReportComponent } from './tax-report.component';

type TaxReportHarness = Readonly<{
  error: () => string | null;
  generatedAt: () => string;
  grandTotalAmount: (side: 'debit' | 'credit') => string;
  isLoading: () => boolean;
  monthTotalAmount: (month: TaxReportResponse['data'][number], side: 'debit' | 'credit') => string;
  onRefresh: () => void;
  reportData: () => TaxReportResponse['data'];
  reportTitle: () => string;
  taxNames: () => readonly string[];
  totalAmount: (taxName: string, side: 'debit' | 'credit') => string;
}>;

const query = { start: '2024-04-01', end: '2025-03-31' };

const report: TaxReportResponse = {
  title: 'Tax Report for Main Branch between 2024-04-01 and 2025-03-31',
  generatedAt: '2026-06-29T18:45:10+05:30',
  data: [
    {
      month: 'April',
      year: 2024,
      taxes: {
        SGST: { debit: 1_200, credit: 1_800 },
        CGST: { debit: 1_200, credit: 1_800 },
      },
    },
    { month: 'May', year: 2024, taxes: {} },
  ],
};

async function settle(): Promise<void> {
  for (let i = 0; i < 20; i += 1) {
    TestBed.flushEffects();
    await Promise.resolve();
  }
}

describe('TaxReportComponent', () => {
  let queryParamMap$: BehaviorSubject<ParamMap>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    queryParamMap$ = new BehaviorSubject(convertToParamMap(query));
  });

  function create(getTaxReport: ReturnType<typeof vi.fn>): TaxReportHarness {
    TestBed.configureTestingModule({
      providers: [
        { provide: TaxReportService, useValue: { getTaxReport } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(query) },
            queryParamMap: queryParamMap$.asObservable(),
          },
        },
        { provide: Router, useValue: { navigate: vi.fn(async () => true) } },
        {
          provide: FiscalYearDateRangeService,
          useValue: {
            range: signal(null),
            toIsoDate: (value: Date) => value.toISOString().slice(0, 10),
          },
        },
        {
          provide: DatepickerDateAdapterService,
          useValue: { adapter: () => ({ parse: (value: string) => new Date(value) }) },
        },
        {
          provide: DateManagementService,
          useValue: { formatDisplayDateTime: vi.fn((value: string) => value) },
        },
        {
          provide: UserSessionStore,
          useValue: {
            session: signal({
              branch: { currencycode: 'INR' },
            }),
          },
        },
      ],
    });

    return TestBed.runInInjectionContext(
      () => new TaxReportComponent(),
    ) as unknown as TaxReportHarness;
  }

  it('loads the report and derives dynamic columns and totals', async () => {
    const getTaxReport = vi.fn(async () => report);
    const component = create(getTaxReport);
    await settle();

    expect(getTaxReport).toHaveBeenCalledWith(query);
    expect(component.isLoading()).toBe(false);
    expect(component.reportTitle()).toBe(report.title);
    expect(component.generatedAt()).toBe(report.generatedAt);
    expect(component.reportData()).toEqual(report.data);
    expect(component.taxNames()).toEqual(['CGST', 'SGST']);
    expect(component.totalAmount('CGST', 'credit')).toBe('1,800.00');
    expect(component.monthTotalAmount(report.data[0]!, 'debit')).toBe('2,400.00');
    expect(component.grandTotalAmount('credit')).toBe('3,600.00');
  });

  it('clears stale report data and exposes API failures', async () => {
    const getTaxReport = vi
      .fn()
      .mockResolvedValueOnce(report)
      .mockRejectedValueOnce(new Error('Exchange rate is required.'));
    const component = create(getTaxReport);
    await settle();

    component.onRefresh();
    await settle();

    expect(component.error()).toBe('Exchange rate is required.');
    expect(component.reportData()).toEqual([]);
    expect(component.reportTitle()).toBe('');
  });
});
