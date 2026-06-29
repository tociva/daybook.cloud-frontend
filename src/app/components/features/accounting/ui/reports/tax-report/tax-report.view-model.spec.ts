import { describe, expect, it } from 'vitest';
import type { TaxReportMonth } from '../../../data/tax-report/tax-report.model';
import { createTaxReportXlsxDocument } from './tax-report.export';
import {
  sortTaxReportMonths,
  taxAmountForMonth,
  taxGrandTotalForReport,
  taxMonthLabel,
  taxMonthRowKey,
  taxNamesForReport,
  taxTotalForMonth,
  taxTotalsForReport,
} from './tax-report.view-model';

const months: readonly TaxReportMonth[] = [
  {
    month: 'April',
    year: 2024,
    taxes: {
      SGST: { debit: 1_200, credit: 1_800 },
      CGST: { debit: 1_200, credit: 1_800 },
    },
  },
  { month: 'May', year: 2024, taxes: {} },
  { month: 'June', year: 2024, taxes: { IGST: { debit: 300, credit: 450 } } },
];

describe('tax report view model', () => {
  it('discovers dynamic tax names in IGST, CGST, SGST order', () => {
    expect(taxNamesForReport(months)).toEqual(['IGST', 'CGST', 'SGST']);
  });

  it('returns zero amounts for a tax missing from a fiscal month', () => {
    expect(taxAmountForMonth(months[1]!, 'CGST')).toEqual({ debit: 0, credit: 0 });
  });

  it('totals each tax across all fiscal months', () => {
    expect(taxTotalsForReport(months, taxNamesForReport(months))).toEqual({
      CGST: { debit: 1_200, credit: 1_800 },
      IGST: { debit: 300, credit: 450 },
      SGST: { debit: 1_200, credit: 1_800 },
    });
  });

  it('totals all taxes for each month and for the report', () => {
    expect(taxTotalForMonth(months[0]!)).toEqual({ debit: 2_400, credit: 3_600 });
    expect(taxTotalForMonth(months[1]!)).toEqual({ debit: 0, credit: 0 });
    expect(taxGrandTotalForReport(months)).toEqual({ debit: 2_700, credit: 4_050 });
  });

  it('builds stable row keys and MMM-YY month labels', () => {
    expect(taxMonthRowKey(months[0]!)).toBe('2024-April');
    expect(taxMonthLabel(months[0]!)).toBe('Apr-24');
    expect(taxMonthLabel(months[2]!)).toBe('Jun-24');
  });

  it('sorts months in ascending calendar order', () => {
    const unsorted: readonly TaxReportMonth[] = [
      { month: 'June', year: 2024, taxes: {} },
      { month: 'April', year: 2024, taxes: {} },
      { month: 'May', year: 2025, taxes: {} },
      { month: 'March', year: 2025, taxes: {} },
    ];

    expect(sortTaxReportMonths(unsorted).map((row) => taxMonthLabel(row))).toEqual([
      'Apr-24',
      'Jun-24',
      'Mar-25',
      'May-25',
    ]);
  });

  it('builds a flattened spreadsheet with branch currency precision', () => {
    const document = createTaxReportXlsxDocument({
      generatedAt: '2026-06-29T18:45:10+05:30',
      minorUnit: 3,
      months,
      taxNames: ['CGST'],
      title: 'Tax Report',
    });

    expect(document.worksheet.columns.map((column) => column.header)).toEqual([
      'Month',
      'CGST Debit',
      'CGST Credit',
      'Total Debit',
      'Total Credit',
    ]);
    expect(document.worksheet.columns[1]?.format).toBe('#,##0.000');
    expect(document.worksheet.rows).toHaveLength(4);
  });
});
