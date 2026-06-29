import type {
  XlsxCell,
  XlsxCellStyle,
  XlsxColumn,
  XlsxExportDocument,
  XlsxRow,
} from '../../../../../../shared/xlsx-export';
import {
  createXlsxReportDocument,
  date,
  number,
  sanitizeFileName,
  text,
} from '../../../../../../shared/xlsx-export';
import type { BalanceSheetData, BalanceSheetItem } from '../../../data/balance-sheet/balance-sheet.model';
import type { LedgerCategoryReportRow } from '../../../data/ledger-category-report/ledger-category-report.model';
import type { LedgerReportRow } from '../../../data/ledger-report/ledger-report.model';
import type { ProfitLossData, ProfitLossItem } from '../../../data/profit-loss/profit-loss.model';
import type { AccountingReportSummaryMetric } from '../../../shared/accounting-report-summary.util';
import { netBalance } from '../../../shared/report-amount.util';
import { journalSourceTypeLabel } from '../../../data/journal';

type AmountKey =
  | 'openingDebit'
  | 'openingCredit'
  | 'runningDebit'
  | 'runningCredit'
  | 'closingDebit'
  | 'closingCredit';

export type TrialBalanceExportTreeRow = Readonly<
  Record<AmountKey, number> & {
    children: readonly TrialBalanceExportTreeRow[];
    kind: 'category' | 'ledger' | 'total';
    name: string;
  }
>;

type SideRowMarker = 'section' | 'total' | 'grandTotal';
type SideRowTuple =
  | readonly [string, string, number]
  | readonly [string, string, number, SideRowMarker]
  | readonly [string, number]
  | readonly [string, number, SideRowMarker];

const AMOUNT_FORMAT = '#,##0.00';
const SECTION_FILL = 'D9EAF7';
const TOTAL_FILL = 'E2E8F0';
const GRAND_TOTAL_FILL = 'CBD5E1';
const META_FILL = 'F8FAFC';

const amountColumns: readonly XlsxColumn[] = [
  { header: 'Opening Debit', key: 'openingDebit', width: 16, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
  { header: 'Opening Credit', key: 'openingCredit', width: 16, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
  { header: 'Running Debit', key: 'runningDebit', width: 16, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
  { header: 'Running Credit', key: 'runningCredit', width: 16, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
  { header: 'Closing Debit', key: 'closingDebit', width: 16, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
  { header: 'Closing Credit', key: 'closingCredit', width: 16, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
];

export function createBalanceSheetXlsxDocument(options: Readonly<{
  asOf?: string | null;
  capitalRows: readonly BalanceSheetItem[];
  data: BalanceSheetData;
  generatedAt?: string | null;
  shouldShowLegacyCurrentYearLoss: boolean;
}>): XlsxExportDocument {
  const rows: XlsxRow[] = [
    metaRow(`As of: ${options.asOf || '—'}`, `Generated at: ${options.generatedAt || '—'}`, 6),
    sectionRow('Assets', 'Liabilities & Equity', 6),
    ...parallelRows(
      [
        ...balanceSheetItemRows(options.data.assets),
        ...(options.shouldShowLegacyCurrentYearLoss
          ? [['Current Year Loss', 'Adjustment', options.data.adjustments.currentYearLoss] as const]
          : []),
        totalTuple('Total Assets', options.data.totals.assets),
      ],
      [
        sectionTuple('Liabilities'),
        ...balanceSheetItemRows(options.data.liabilities),
        totalTuple('Total Liabilities', options.data.totals.liabilities),
        sectionTuple('Capital / Equity'),
        ...balanceSheetItemRows(options.capitalRows),
        totalTuple('Total Capital / Equity', options.data.totals.capital),
        totalTuple('Total Liabilities & Equity', options.data.totals.liabilitiesAndEquity, true),
      ],
    ),
  ];

  return createXlsxReportDocument({
    columns: [
      { header: 'Asset', key: 'asset', width: 28 },
      { header: 'Category', key: 'assetCategory', width: 22 },
      { header: 'Amount', key: 'assetAmount', width: 16, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
      { header: 'Liability / Equity', key: 'liabilityEquity', width: 28 },
      { header: 'Category', key: 'liabilityEquityCategory', width: 22 },
      { header: 'Amount', key: 'liabilityEquityAmount', width: 16, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
    ],
    fileNameBase: 'balance-sheet',
    freezeRows: 2,
    rowCount: balanceSheetRowCount(options.data, options.capitalRows, options.shouldShowLegacyCurrentYearLoss),
    rows,
    sheetName: 'Balance Sheet',
    title: `Balance Sheet${options.asOf ? ` - As of ${options.asOf}` : ''}`,
  });
}

export function createProfitLossXlsxDocument(options: Readonly<{
  data: ProfitLossData;
  end?: string | null;
  generatedAt?: string | null;
  start?: string | null;
}>): XlsxExportDocument {
  const totals = options.data.totals;
  const isGrossProfit = totals.grossProfit > 0;
  const isNetProfit = totals.netProfit > 0;
  const hasUnclassified =
    options.data.unclassifiedIncome.length > 0 || options.data.unclassifiedExpense.length > 0;
  const rows: XlsxRow[] = [
    metaRow(periodLabel(options.start, options.end), `Generated at: ${options.generatedAt || '—'}`, 4),
    sectionRow('Trading Account', '', 4),
    sectionRow('Direct Income', 'Direct Expense', 4),
    ...parallelRows(
      [
        ...profitLossItemRows(options.data.directIncome),
        amountTuple('Total Direct Income', totals.directIncome, 'total'),
        ...(!isGrossProfit ? [amountTuple('Gross Loss c/d', totals.grossLoss, 'grandTotal')] : []),
      ],
      [
        ...profitLossItemRows(options.data.directExpense),
        amountTuple('Total Direct Expense', totals.directExpense, 'total'),
        ...(isGrossProfit ? [amountTuple('Gross Profit c/d', totals.grossProfit, 'grandTotal')] : []),
      ],
      2,
    ),
    sectionRow('Profit & Loss Account', '', 4),
    sectionRow('Indirect Income', 'Indirect Expense', 4),
    ...parallelRows(
      [
        ...(isGrossProfit ? [amountTuple('Gross Profit b/d', totals.grossProfit, 'total')] : []),
        ...profitLossItemRows(options.data.indirectIncome),
        amountTuple('Total Indirect Income', totals.indirectIncome, 'total'),
        ...(!isNetProfit ? [amountTuple('Net Loss', totals.netLoss, 'grandTotal')] : []),
      ],
      [
        ...(!isGrossProfit ? [amountTuple('Gross Loss b/d', totals.grossLoss, 'total')] : []),
        ...profitLossItemRows(options.data.indirectExpense),
        amountTuple('Total Indirect Expense', totals.indirectExpense, 'total'),
        ...(isNetProfit ? [amountTuple('Net Profit', totals.netProfit, 'grandTotal')] : []),
      ],
      2,
    ),
    ...(hasUnclassified
      ? [
          sectionRow('Unclassified', '', 4),
          sectionRow('Unclassified Income', 'Unclassified Expense', 4),
          ...parallelRows(
            [
              ...profitLossItemRows(options.data.unclassifiedIncome),
              amountTuple('Total', totals.unclassifiedIncome, 'total'),
            ],
            [
              ...profitLossItemRows(options.data.unclassifiedExpense),
              amountTuple('Total', totals.unclassifiedExpense, 'total'),
            ],
            2,
          ),
        ]
      : []),
  ];

  return createXlsxReportDocument({
    columns: [
      { header: 'Income', key: 'income', width: 34 },
      { header: 'Amount', key: 'incomeAmount', width: 16, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
      { header: 'Expense', key: 'expense', width: 34 },
      { header: 'Amount', key: 'expenseAmount', width: 16, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
    ],
    fileNameBase: 'profit-loss',
    freezeRows: 2,
    rowCount: profitLossRowCount(options.data),
    rows,
    sheetName: 'Profit & Loss',
    title: `Profit & Loss - ${periodLabel(options.start, options.end)}`,
  });
}

export function createTrialBalanceXlsxDocument(options: Readonly<{
  end?: string | null;
  generatedAt?: string | null;
  rows: readonly TrialBalanceExportTreeRow[];
  start?: string | null;
}>): XlsxExportDocument {
  const rows = flattenTrialBalanceRows(options.rows);

  return createXlsxReportDocument({
    columns: [
      { header: 'Level', key: 'level', width: 10, kind: 'number', align: 'right' },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Name', key: 'name', width: 36 },
      ...amountColumns,
    ],
    fileNameBase: 'trial-balance',
    freezeRows: 2,
    rowCount: rows.length,
    rows: [
      metaRow(periodLabel(options.start, options.end), `Generated at: ${options.generatedAt || '—'}`, 9),
      ...rows,
    ],
    sheetName: 'Trial Balance',
    title: `Trial Balance - ${periodLabel(options.start, options.end)}`,
  });
}

export function createLedgerReportXlsxDocument(options: Readonly<{
  generatedAt?: string | null;
  ledgerName: string;
  rows: readonly LedgerReportRow[];
  summaryMetrics: readonly AccountingReportSummaryMetric[];
  title?: string | null;
}>): XlsxExportDocument {
  return createXlsxReportDocument({
    columns: ledgerReportColumns,
    fileNameBase: `ledger-report-${sanitizeFileName(options.ledgerName || 'ledger')}`,
    freezeRows: 2,
    rowCount: options.rows.length,
    rows: [
      metaRow(`Ledger: ${options.ledgerName || '—'}`, `Generated at: ${options.generatedAt || '—'}`, ledgerReportColumns.length),
      ...summaryRows(options.summaryMetrics, ledgerReportColumns.length),
      ...options.rows.map(ledgerReportRow),
    ],
    sheetName: options.ledgerName || 'Ledger Report',
    title: options.title || `Ledger Report - ${options.ledgerName}`,
  });
}

export function createLedgerCategoryReportXlsxDocument(options: Readonly<{
  categoryName: string;
  generatedAt?: string | null;
  rows: readonly LedgerCategoryReportRow[];
  summaryMetrics: readonly AccountingReportSummaryMetric[];
  title?: string | null;
}>): XlsxExportDocument {
  return createXlsxReportDocument({
    columns: ledgerCategoryReportColumns,
    fileNameBase: `ledger-category-report-${sanitizeFileName(options.categoryName || 'category')}`,
    freezeRows: 2,
    rowCount: options.rows.length,
    rows: [
      metaRow(`Category: ${options.categoryName || '—'}`, `Generated at: ${options.generatedAt || '—'}`, ledgerCategoryReportColumns.length),
      ...summaryRows(options.summaryMetrics, ledgerCategoryReportColumns.length),
      ...options.rows.map(ledgerCategoryReportRow),
    ],
    sheetName: options.categoryName || 'Ledger Category Report',
    title: options.title || `Ledger Category Report - ${options.categoryName}`,
  });
}

function balanceSheetItemRows(items: readonly BalanceSheetItem[]): readonly (readonly [string, string, number])[] {
  return items.map((item) => [item.name, item.category, item.amount] as const);
}

function profitLossItemRows(items: readonly ProfitLossItem[]): readonly (readonly [string, number])[] {
  return items.map((item) => [item.name, item.amount] as const);
}

function sectionTuple(label: string): readonly [string, string, number, 'section'] {
  return [label, '', 0, 'section'];
}

function totalTuple(label: string, amount: number, grand = false): readonly [string, string, number, 'total' | 'grandTotal'] {
  return [label, '', amount, grand ? 'grandTotal' : 'total'];
}

function amountTuple(
  label: string,
  amount: number,
  marker: 'total' | 'grandTotal',
): readonly [string, number, 'total' | 'grandTotal'] {
  return [label, amount, marker];
}

function parallelRows(
  leftRows: readonly SideRowTuple[],
  rightRows: readonly SideRowTuple[],
  columnsPerSide = 3,
): XlsxRow[] {
  const length = Math.max(leftRows.length, rightRows.length);
  const rows: XlsxRow[] = [];
  for (let index = 0; index < length; index += 1) {
    rows.push([
      ...sideCells(leftRows[index], columnsPerSide),
      ...sideCells(rightRows[index], columnsPerSide),
    ]);
  }
  return rows;
}

function sideCells(
  row: readonly unknown[] | undefined,
  columnsPerSide: number,
): XlsxRow {
  if (!row) {
    return Array.from({ length: columnsPerSide }, () => text(''));
  }

  const label = String(row[0] ?? '');
  const categoryOrAmount = row[1];
  const hasCategoryColumn = columnsPerSide === 3;
  const amount = hasCategoryColumn ? row[2] : row[1];
  const marker = (hasCategoryColumn ? row[3] : row[2]) as 'section' | 'total' | 'grandTotal' | undefined;
  const style = marker
    ? {
        bold: true,
        fill: marker === 'section' ? SECTION_FILL : marker === 'grandTotal' ? GRAND_TOTAL_FILL : TOTAL_FILL,
      }
    : undefined;

  if (marker === 'section') {
    return hasCategoryColumn
      ? [textCell(label, style), textCell('', style), textCell('', style)]
      : [textCell(label, style), textCell('', style)];
  }

  return hasCategoryColumn
    ? [
        textCell(label, style),
        textCell(String(categoryOrAmount ?? ''), style),
        amountCell(amount, style),
      ]
    : [textCell(label, style), amountCell(amount, style)];
}

function sectionRow(left: string, right: string, width: 4 | 6): XlsxRow {
  const row = [
    textCell(left, { bold: true, fill: SECTION_FILL }),
    textCell('', { bold: true, fill: SECTION_FILL }),
    ...(width === 6 ? [textCell('', { bold: true, fill: SECTION_FILL })] : []),
    textCell(right, { bold: true, fill: SECTION_FILL }),
    textCell('', { bold: true, fill: SECTION_FILL }),
    ...(width === 6 ? [textCell('', { bold: true, fill: SECTION_FILL })] : []),
  ];
  return row;
}

function metaRow(left: string, right: string, width: number): XlsxRow {
  const cells = Array.from({ length: width }, () => textCell('', { fill: META_FILL }));
  cells[0] = textCell(left, { bold: true, fill: META_FILL });
  if (width > 1) cells[Math.ceil(width / 2)] = textCell(right, { fill: META_FILL });
  return cells;
}

function summaryRows(
  metrics: readonly AccountingReportSummaryMetric[],
  width: number,
): XlsxRow[] {
  const rows: XlsxRow[] = [];
  for (let index = 0; index < metrics.length; index += 2) {
    const first = metrics[index];
    const second = metrics[index + 1];
    const row = Array.from({ length: width }, () => textCell('', { fill: META_FILL }));
    row[0] = textCell(first.label, { bold: true, fill: META_FILL });
    row[1] = textCell(first.value, { fill: META_FILL });
    if (second) {
      row[3] = textCell(second.label, { bold: true, fill: META_FILL });
      row[4] = textCell(second.value, { fill: META_FILL });
    }
    rows.push(row);
  }
  return rows;
}

function flattenTrialBalanceRows(
  rows: readonly TrialBalanceExportTreeRow[],
  level = 0,
): XlsxRow[] {
  const flattened: XlsxRow[] = [];
  for (const row of rows) {
    const fill = row.kind === 'total' ? GRAND_TOTAL_FILL : row.kind === 'category' ? TOTAL_FILL : undefined;
    const bold = row.kind !== 'ledger';
    flattened.push([
      number(level, '#,##0'),
      textCell(row.kind, { bold, fill }),
      textCell(row.name, { bold, fill, indent: level }),
      amountCell(row.openingDebit, { bold, fill }),
      amountCell(row.openingCredit, { bold, fill }),
      amountCell(row.runningDebit, { bold, fill }),
      amountCell(row.runningCredit, { bold, fill }),
      amountCell(row.closingDebit, { bold, fill }),
      amountCell(row.closingCredit, { bold, fill }),
    ]);
    flattened.push(...flattenTrialBalanceRows(row.children, level + 1));
  }
  return flattened;
}

const ledgerReportColumns: readonly XlsxColumn[] = [
  { header: 'Date', key: 'date', width: 14, kind: 'date', format: 'yyyy-mm-dd' },
  { header: 'Journal #', key: 'journalNumber', width: 16 },
  { header: 'Type', key: 'type', width: 16 },
  { header: 'Description', key: 'description', width: 34 },
  { header: 'Debit', key: 'debit', width: 14, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
  { header: 'Credit', key: 'credit', width: 14, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
  { header: 'Against', key: 'against', width: 28 },
  { header: 'Balance', key: 'balance', width: 16, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
  { header: 'Side', key: 'side', width: 8 },
];

const ledgerCategoryReportColumns: readonly XlsxColumn[] = [
  { header: 'Date', key: 'date', width: 14, kind: 'date', format: 'yyyy-mm-dd' },
  { header: 'Journal #', key: 'journalNumber', width: 16 },
  { header: 'Type', key: 'type', width: 16 },
  { header: 'Ledger', key: 'ledger', width: 24 },
  { header: 'Description', key: 'description', width: 34 },
  { header: 'Debit', key: 'debit', width: 14, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
  { header: 'Credit', key: 'credit', width: 14, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
  { header: 'Against', key: 'against', width: 28 },
  { header: 'Balance', key: 'balance', width: 16, kind: 'number', format: AMOUNT_FORMAT, align: 'right' },
  { header: 'Side', key: 'side', width: 8 },
];

function ledgerReportRow(row: LedgerReportRow): XlsxRow {
  const balance = netBalance(row.balanceDebit, row.balanceCredit);
  return [
    date(row.date),
    text(row.journalNumber),
    text(journalSourceTypeLabel(row.sourcetype)),
    text(row.description),
    amountCell(row.debit),
    amountCell(row.credit),
    text(row.oppositeLedgers.map((ledger) => ledger.ledgerName).join(', ')),
    amountCell(balance.amount),
    text(balance.side),
  ];
}

function ledgerCategoryReportRow(row: LedgerCategoryReportRow): XlsxRow {
  const balance = netBalance(row.balanceDebit, row.balanceCredit);
  return [
    date(row.date),
    text(row.journalNumber),
    text(journalSourceTypeLabel(row.sourcetype)),
    text(row.ledgerName),
    text(row.description),
    amountCell(row.debit),
    amountCell(row.credit),
    text(row.oppositeLedgers.map((ledger) => ledger.ledgerName).join(', ')),
    amountCell(balance.amount),
    text(balance.side),
  ];
}

function balanceSheetRowCount(
  data: BalanceSheetData,
  capitalRows: readonly BalanceSheetItem[],
  showLegacyCurrentYearLoss: boolean,
): number {
  return (
    data.assets.length +
    data.liabilities.length +
    capitalRows.length +
    (showLegacyCurrentYearLoss ? 1 : 0)
  );
}

function profitLossRowCount(data: ProfitLossData): number {
  return (
    data.directIncome.length +
    data.directExpense.length +
    data.indirectIncome.length +
    data.indirectExpense.length +
    data.unclassifiedIncome.length +
    data.unclassifiedExpense.length
  );
}

function periodLabel(start?: string | null, end?: string | null): string {
  if (start && end) return `Period: ${start} to ${end}`;
  if (end) return `As of: ${end}`;
  if (start) return `From: ${start}`;
  return 'Period: —';
}

function textCell(value: unknown, style?: XlsxCellStyle): XlsxCell {
  return { ...text(value), style };
}

function amountCell(value: unknown, style?: XlsxCellStyle): XlsxCell {
  const cell = number(value, AMOUNT_FORMAT);
  return { ...cell, style: { ...cell.style, ...style } };
}
