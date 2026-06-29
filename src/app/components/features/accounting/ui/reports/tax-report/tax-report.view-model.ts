import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type { TaxReportAmount, TaxReportMonth } from '../../../data/tax-report/tax-report.model';

dayjs.extend(customParseFormat);

const emptyAmount = (): TaxReportAmount => ({ debit: 0, credit: 0 });

const TAX_NAME_ORDER: readonly string[] = ['IGST', 'CGST', 'SGST'];

export function taxNamesForReport(months: readonly TaxReportMonth[]): readonly string[] {
  return [...new Set(months.flatMap((month) => Object.keys(month.taxes)))].sort(compareTaxNames);
}

function compareTaxNames(a: string, b: string): number {
  const orderDiff = taxNameSortIndex(a) - taxNameSortIndex(b);
  return orderDiff !== 0 ? orderDiff : a.localeCompare(b);
}

function taxNameSortIndex(name: string): number {
  const index = TAX_NAME_ORDER.indexOf(name);
  return index === -1 ? TAX_NAME_ORDER.length : index;
}

export function taxTotalsForReport(
  months: readonly TaxReportMonth[],
  taxNames: readonly string[],
): Readonly<Record<string, TaxReportAmount>> {
  const totals: Record<string, TaxReportAmount> = {};

  for (const taxName of taxNames) {
    let debit = 0;
    let credit = 0;
    for (const month of months) {
      debit += finiteAmount(month.taxes[taxName]?.debit);
      credit += finiteAmount(month.taxes[taxName]?.credit);
    }
    totals[taxName] = { debit, credit };
  }

  return totals;
}

export function taxAmountForMonth(month: TaxReportMonth, taxName: string): TaxReportAmount {
  return month.taxes[taxName] ?? emptyAmount();
}

export function taxTotalForMonth(month: TaxReportMonth): TaxReportAmount {
  let debit = 0;
  let credit = 0;

  for (const amount of Object.values(month.taxes)) {
    debit += finiteAmount(amount.debit);
    credit += finiteAmount(amount.credit);
  }

  return { debit, credit };
}

export function taxGrandTotalForReport(months: readonly TaxReportMonth[]): TaxReportAmount {
  let debit = 0;
  let credit = 0;

  for (const month of months) {
    const total = taxTotalForMonth(month);
    debit += total.debit;
    credit += total.credit;
  }

  return { debit, credit };
}

function finiteAmount(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function taxMonthRowKey(row: TaxReportMonth): string {
  return `${row.year}-${row.month}`;
}

export function parseTaxReportMonth(row: TaxReportMonth): dayjs.Dayjs | null {
  const parsed = dayjs(`${row.month} 1, ${row.year}`, 'MMMM D, YYYY', true);
  return parsed.isValid() ? parsed : null;
}

export function taxMonthLabel(row: TaxReportMonth): string {
  const parsed = parseTaxReportMonth(row);
  if (parsed) {
    return parsed.format('MMM-YY');
  }

  const yearSuffix = String(row.year).slice(-2).padStart(2, '0');
  return `${row.month}-${yearSuffix}`;
}

export function sortTaxReportMonths(months: readonly TaxReportMonth[]): readonly TaxReportMonth[] {
  return [...months].sort((left, right) => {
    const leftValue = parseTaxReportMonth(left)?.valueOf() ?? 0;
    const rightValue = parseTaxReportMonth(right)?.valueOf() ?? 0;
    return leftValue - rightValue;
  });
}
