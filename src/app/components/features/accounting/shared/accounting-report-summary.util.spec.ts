import { describe, expect, it } from 'vitest';
import {
  buildAccountingReportSummaryMetrics,
  type AccountingReportSummary,
} from './accounting-report-summary.util';

const summary: AccountingReportSummary = {
  openingDebit: 100,
  openingCredit: 40,
  runningDebit: 25,
  runningCredit: 75,
  closingDebit: 0,
  closingCredit: 10,
};

describe('buildAccountingReportSummaryMetrics', () => {
  it('formats the four summary columns', () => {
    const metrics = buildAccountingReportSummaryMetrics(summary, 2, '₹');

    expect(metrics).toEqual([
      {
        id: 'openingBalance',
        label: 'Opening Balance',
        value: '₹ 60.00 Dr',
      },
      {
        id: 'runningDebit',
        label: 'Running Debit',
        value: '₹ 25.00',
      },
      {
        id: 'runningCredit',
        label: 'Running Credit',
        value: '₹ 75.00',
      },
      {
        id: 'closingBalance',
        label: 'Closing Balance',
        value: '₹ 10.00 Cr',
      },
    ]);
  });

  it('formats zero balances in the four-column layout', () => {
    const metrics = buildAccountingReportSummaryMetrics(
      {
        openingDebit: 0,
        openingCredit: 0,
        runningDebit: 0,
        runningCredit: 0,
        closingDebit: 0,
        closingCredit: 0,
      },
      2,
      '₹',
    );

    expect(metrics).toEqual([
      {
        id: 'openingBalance',
        label: 'Opening Balance',
        value: '₹ 0.00 Dr',
      },
      {
        id: 'runningDebit',
        label: 'Running Debit',
        value: '₹ 0.00',
      },
      {
        id: 'runningCredit',
        label: 'Running Credit',
        value: '₹ 0.00',
      },
      {
        id: 'closingBalance',
        label: 'Closing Balance',
        value: '₹ 0.00',
      },
    ]);
  });
});
