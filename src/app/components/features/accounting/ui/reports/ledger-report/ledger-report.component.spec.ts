import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import type { LedgerReportRow } from '../../../data/ledger-report/ledger-report.model';
import { LedgerReportComponent } from './ledger-report.component';
import { LedgerReportFacade, emptyLedgerReportSummary } from './ledger-report.facade';

type LedgerReportHarness = Readonly<{
  collapseOppositeLedgers: (row: LedgerReportRow) => void;
  expandOppositeLedgers: (row: LedgerReportRow) => void;
  hiddenOppositeLedgerCount: (row: LedgerReportRow) => number;
  showOppositeLedgerLess: (row: LedgerReportRow) => boolean;
  showOppositeLedgerMore: (row: LedgerReportRow) => boolean;
  visibleOppositeLedgers: (row: LedgerReportRow) => LedgerReportRow['oppositeLedgers'];
}>;

const oppositeLedger = (ledgerid: string, ledgerName: string) => ({
  ledgerid,
  ledgerName,
});

const reportRow = (
  oppositeLedgers: LedgerReportRow['oppositeLedgers'],
  overrides: Partial<LedgerReportRow> = {},
): LedgerReportRow => ({
  journalid: 'journal-1',
  journalNumber: 'JV-1',
  sourcetype: 'journal',
  date: '2026-04-15',
  description: 'Opening entry',
  order: 1,
  debit: 100,
  credit: 0,
  oppositeLedgers,
  runningDebit: 100,
  runningCredit: 0,
  balanceDebit: 100,
  balanceCredit: 0,
  ...overrides,
});

function setup(): LedgerReportHarness {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: DateManagementService,
        useValue: {
          formatDisplayDate: vi.fn(
            (value: string | null | undefined, fallback: string) => value ?? fallback,
          ),
          formatDisplayDateTime: vi.fn(
            (value: string | null | undefined, fallback: string) => value ?? fallback,
          ),
        },
      },
      {
        provide: LedgerReportFacade,
        useValue: {
          autocompleteLedgers: signal([]),
          canViewLedgerReport: signal(true),
          displayError: signal(null),
          draftLedgerId: signal(null),
          generatedAt: signal(''),
          hasError: signal(false),
          hasLedgerSelected: signal(true),
          isLoading: signal(false),
          ledgerOptionLabel: () => '',
          ledgerOptionValue: () => '',
          ledgerTrackBy: () => '',
          selectedLedgerName: signal('Cash'),
          showSelectLedgerNotice: signal(false),
          summary: signal(emptyLedgerReportSummary()),
          tableRows: signal([]),
          title: signal('Ledger Report'),
          applyLedgerSelection: vi.fn(),
          onDraftLedgerChange: vi.fn(),
          onLedgerQueryChange: vi.fn(),
          onRefresh: vi.fn(),
          openOppositeLedger: vi.fn(),
          viewJournal: vi.fn(),
        },
      },
      {
        provide: UserSessionStore,
        useValue: {
          session: signal(null),
        },
      },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new LedgerReportComponent());
  return component as unknown as LedgerReportHarness;
}

describe('LedgerReportComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('plans an empty against cell when a row has no opposite ledgers', () => {
    const component = setup();
    const row = reportRow([]);

    expect(component.visibleOppositeLedgers(row)).toEqual([]);
    expect(component.hiddenOppositeLedgerCount(row)).toBe(0);
    expect(component.showOppositeLedgerMore(row)).toBe(false);
    expect(component.showOppositeLedgerLess(row)).toBe(false);
  });

  it('shows one opposite ledger without a more control', () => {
    const component = setup();
    const row = reportRow([oppositeLedger('sales', 'Sales')]);

    expect(component.visibleOppositeLedgers(row)).toEqual([oppositeLedger('sales', 'Sales')]);
    expect(component.hiddenOppositeLedgerCount(row)).toBe(0);
    expect(component.showOppositeLedgerMore(row)).toBe(false);
  });

  it('shows the first opposite ledger and +1 more for two ledgers', () => {
    const component = setup();
    const row = reportRow([oppositeLedger('sales', 'Sales'), oppositeLedger('tax', 'Output GST')]);

    expect(component.visibleOppositeLedgers(row)).toEqual([oppositeLedger('sales', 'Sales')]);
    expect(component.hiddenOppositeLedgerCount(row)).toBe(1);
    expect(component.showOppositeLedgerMore(row)).toBe(true);
  });

  it('shows the first opposite ledger and +2 more for three ledgers', () => {
    const component = setup();
    const row = reportRow([
      oppositeLedger('sales', 'Sales'),
      oppositeLedger('tax', 'Output GST'),
      oppositeLedger('rounding', 'Round Off'),
    ]);

    expect(component.visibleOppositeLedgers(row)).toEqual([oppositeLedger('sales', 'Sales')]);
    expect(component.hiddenOppositeLedgerCount(row)).toBe(2);
    expect(component.showOppositeLedgerMore(row)).toBe(true);
  });

  it('expands and collapses hidden opposite ledgers for a row', () => {
    const component = setup();
    const ledgers = [
      oppositeLedger('sales', 'Sales'),
      oppositeLedger('tax', 'Output GST'),
      oppositeLedger('rounding', 'Round Off'),
    ];
    const row = reportRow(ledgers);

    component.expandOppositeLedgers(row);

    expect(component.visibleOppositeLedgers(row)).toEqual(ledgers);
    expect(component.showOppositeLedgerMore(row)).toBe(false);
    expect(component.showOppositeLedgerLess(row)).toBe(true);

    component.collapseOppositeLedgers(row);

    expect(component.visibleOppositeLedgers(row)).toEqual([oppositeLedger('sales', 'Sales')]);
    expect(component.showOppositeLedgerMore(row)).toBe(true);
    expect(component.showOppositeLedgerLess(row)).toBe(false);
  });
});
