import type { TaxReportMonth } from '../../../data/tax-report/tax-report.model';
import type { XlsxColumn, XlsxExportDocument, XlsxRow } from '../../../../../../shared/xlsx-export';
import { createXlsxReportDocument, number, text } from '../../../../../../shared/xlsx-export';
import {
  taxAmountForMonth,
  taxGrandTotalForReport,
  taxMonthLabel,
  taxTotalForMonth,
  taxTotalsForReport,
} from './tax-report.view-model';

export function createTaxReportXlsxDocument(
  options: Readonly<{
    generatedAt?: string | null;
    minorUnit?: number;
    months: readonly TaxReportMonth[];
    taxNames: readonly string[];
    title?: string | null;
  }>,
): XlsxExportDocument {
  const amountFormat = xlsxAmountFormat(options.minorUnit ?? 2);
  const columns: XlsxColumn[] = [{ header: 'Month', key: 'month', width: 16 }];

  for (const taxName of options.taxNames) {
    columns.push(
      {
        header: `${taxName} Debit`,
        key: `${taxName}-debit`,
        width: 16,
        kind: 'number',
        format: amountFormat,
        align: 'right',
      },
      {
        header: `${taxName} Credit`,
        key: `${taxName}-credit`,
        width: 16,
        kind: 'number',
        format: amountFormat,
        align: 'right',
      },
    );
  }
  columns.push(
    {
      header: 'Total Debit',
      key: 'total-debit',
      width: 16,
      kind: 'number',
      format: amountFormat,
      align: 'right',
    },
    {
      header: 'Total Credit',
      key: 'total-credit',
      width: 16,
      kind: 'number',
      format: amountFormat,
      align: 'right',
    },
  );

  const rows: XlsxRow[] = options.months.map((month) => {
    const total = taxTotalForMonth(month);
    return [
      text(taxMonthLabel(month)),
      ...options.taxNames.flatMap((taxName) => {
        const amount = taxAmountForMonth(month, taxName);
        return [number(amount.debit, amountFormat), number(amount.credit, amountFormat)];
      }),
      number(total.debit, amountFormat),
      number(total.credit, amountFormat),
    ];
  });

  const totals = taxTotalsForReport(options.months, options.taxNames);
  const grandTotal = taxGrandTotalForReport(options.months);
  rows.push([
    text('Total'),
    ...options.taxNames.flatMap((taxName) => [
      number(totals[taxName]?.debit, amountFormat),
      number(totals[taxName]?.credit, amountFormat),
    ]),
    number(grandTotal.debit, amountFormat),
    number(grandTotal.credit, amountFormat),
  ]);

  const title = options.title?.trim() || 'Tax Report';
  return createXlsxReportDocument({
    columns,
    fileNameBase: 'tax-report',
    freezeRows: 2,
    headerRows: [[text(`Generated at: ${options.generatedAt || '—'}`)]],
    rowCount: options.months.length,
    rows,
    sheetName: 'Tax Report',
    title,
  });
}

function xlsxAmountFormat(minorUnit: number): string {
  const precision = Number.isInteger(minorUnit) ? Math.min(Math.max(minorUnit, 0), 10) : 2;
  return precision === 0 ? '#,##0' : `#,##0.${'0'.repeat(precision)}`;
}
