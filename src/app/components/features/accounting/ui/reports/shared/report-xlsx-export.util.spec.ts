import { describe, expect, it } from 'vitest';
import type { BalanceSheetData } from '../../../data/balance-sheet/balance-sheet.model';
import type { ProfitLossData } from '../../../data/profit-loss/profit-loss.model';
import {
  createBalanceSheetXlsxDocument,
  createLedgerCategoryReportXlsxDocument,
  createLedgerReportXlsxDocument,
  createProfitLossXlsxDocument,
  createTrialBalanceXlsxDocument,
  type TrialBalanceExportTreeRow,
} from './report-xlsx-export.util';

const balanceSheetData = (): BalanceSheetData => ({
  assets: [{ ledgerid: 'cash', name: 'Cash', category: 'Current Assets', amount: 1000 }],
  liabilities: [{ ledgerid: 'loan', name: 'Loan', category: 'Loans', amount: 400 }],
  capital: [{ ledgerid: 'capital', name: 'Capital', category: 'Capital', amount: 600 }],
  adjustments: { currentYearProfit: 0, currentYearLoss: 0 },
  totals: {
    assets: 1000,
    liabilities: 400,
    capital: 600,
    liabilitiesAndEquity: 1000,
    currentYearProfit: 0,
    currentYearLoss: 0,
  },
});

const profitLossData = (): ProfitLossData => ({
  directIncome: [{ ledgerid: 'sales', name: 'Sales', amount: 1500 }],
  directExpense: [{ ledgerid: 'purchase', name: 'Purchase', amount: 900 }],
  indirectIncome: [],
  indirectExpense: [{ ledgerid: 'rent', name: 'Rent', amount: 100 }],
  unclassifiedIncome: [],
  unclassifiedExpense: [],
  totals: {
    directIncome: 1500,
    directExpense: 900,
    grossProfit: 600,
    grossLoss: 0,
    indirectIncome: 0,
    indirectExpense: 100,
    netProfit: 500,
    netLoss: 0,
    unclassifiedIncome: 0,
    unclassifiedExpense: 0,
  },
});

describe('report XLSX export utilities', () => {
  it('creates a styled two-sided balance sheet document with typed amounts', () => {
    const document = createBalanceSheetXlsxDocument({
      asOf: '2026-06-29',
      capitalRows: balanceSheetData().capital,
      data: balanceSheetData(),
      generatedAt: '2026-06-29T10:00:00Z',
      shouldShowLegacyCurrentYearLoss: false,
    });

    expect(document.worksheet.name).toBe('Balance Sheet');
    expect(document.rowCount).toBe(3);
    expect(document.worksheet.columns).toHaveLength(6);
    expect(document.worksheet.rows.some((row) => row.some((cell) => cellValue(cell) === 'Cash'))).toBe(true);
    expect(document.worksheet.rows.some((row) => row.some((cell) => cellValue(cell) === 1000))).toBe(true);
  });

  it('creates a profit and loss document with gross and net result rows', () => {
    const document = createProfitLossXlsxDocument({
      data: profitLossData(),
      end: '2027-03-31',
      generatedAt: '2026-06-29T10:00:00Z',
      start: '2026-04-01',
    });

    expect(document.worksheet.name).toBe('Profit & Loss');
    expect(document.rowCount).toBe(3);
    expect(document.worksheet.columns).toHaveLength(4);
    expect(document.worksheet.rows.some((row) => row.some((cell) => cellValue(cell) === 'Gross Profit c/d'))).toBe(true);
    expect(document.worksheet.rows.some((row) => row.some((cell) => cellValue(cell) === 'Net Profit'))).toBe(true);
  });

  it('flattens trial balance hierarchy and preserves indentation metadata', () => {
    const rows: readonly TrialBalanceExportTreeRow[] = [
      {
        children: [
          {
            children: [],
            kind: 'ledger',
            name: 'Cash',
            openingDebit: 10,
            openingCredit: 0,
            runningDebit: 5,
            runningCredit: 0,
            closingDebit: 15,
            closingCredit: 0,
          },
        ],
        kind: 'category',
        name: 'Assets',
        openingDebit: 10,
        openingCredit: 0,
        runningDebit: 5,
        runningCredit: 0,
        closingDebit: 15,
        closingCredit: 0,
      },
    ];

    const document = createTrialBalanceXlsxDocument({
      end: '2027-03-31',
      generatedAt: '2026-06-29T10:00:00Z',
      rows,
      start: '2026-04-01',
    });

    const ledgerRow = document.worksheet.rows.find((row) =>
      row.some((cell) => cellValue(cell) === 'Cash'),
    );

    expect(document.rowCount).toBe(2);
    expect(document.worksheet.columns.map((column) => column.header)).toContain('Closing Credit');
    expect(cellStyle(ledgerRow?.[2])?.indent).toBe(1);
  });

  it('creates ledger transaction exports with full opposite ledger names', () => {
    const document = createLedgerReportXlsxDocument({
      generatedAt: '2026-06-29T10:00:00Z',
      ledgerName: 'Cash',
      rows: [
        {
          balanceCredit: 0,
          balanceDebit: 100,
          credit: 0,
          date: '2026-06-29',
          debit: 100,
          description: 'Opening receipt',
          journalNumber: 'JV-1',
          journalid: 'journal-1',
          oppositeLedgers: [
            { ledgerid: 'sales', ledgerName: 'Sales' },
            { ledgerid: 'tax', ledgerName: 'Tax Payable' },
          ],
          order: 1,
          runningCredit: 0,
          runningDebit: 100,
          sourcetype: 'journal',
        },
      ],
      summaryMetrics: [],
      title: 'Cash Ledger',
    });

    expect(document.rowCount).toBe(1);
    expect(document.worksheet.rows.some((row) => row.some((cell) => cellValue(cell) === 'Sales, Tax Payable'))).toBe(true);
  });

  it('creates ledger category transaction exports with ledger column', () => {
    const document = createLedgerCategoryReportXlsxDocument({
      categoryName: 'Assets',
      generatedAt: '2026-06-29T10:00:00Z',
      rows: [
        {
          balanceCredit: 0,
          balanceDebit: 100,
          credit: 0,
          date: '2026-06-29',
          debit: 100,
          description: 'Receipt',
          journalNumber: 'JV-1',
          journalid: 'journal-1',
          ledgerCategoryName: 'Assets',
          ledgerName: 'Cash',
          ledgercategoryid: 'assets',
          ledgerid: 'cash',
          oppositeLedgers: [{ ledgerid: 'sales', ledgerName: 'Sales' }],
          order: 1,
          runningCredit: 0,
          runningDebit: 100,
          sourcetype: 'journal',
        },
      ],
      summaryMetrics: [],
      title: 'Assets Ledger Category',
    });

    expect(document.rowCount).toBe(1);
    expect(document.worksheet.columns.map((column) => column.header)).toContain('Ledger');
    expect(document.worksheet.rows.some((row) => row.some((cell) => cellValue(cell) === 'Cash'))).toBe(true);
  });
});

function cellValue(cell: unknown): unknown {
  return typeof cell === 'object' && cell !== null && 'value' in cell
    ? (cell as { value: unknown }).value
    : cell;
}

function cellStyle(cell: unknown): { indent?: number } | undefined {
  return typeof cell === 'object' && cell !== null && 'style' in cell
    ? (cell as { style?: { indent?: number } }).style
    : undefined;
}
