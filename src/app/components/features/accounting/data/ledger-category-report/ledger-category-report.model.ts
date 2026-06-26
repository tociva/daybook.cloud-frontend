import type { AccountingReportSummary } from '../../shared/accounting-report-summary.util';
import type { JournalSourceTypeValue } from '../journal';

export type LedgerCategoryReportOppositeLedger = Readonly<{
  ledgerid: string;
  ledgerName: string;
}>;

export type LedgerCategoryReportRow = Readonly<{
  journalid: string;
  journalNumber: string;
  sourcetype: JournalSourceTypeValue;
  date: string;
  description?: string;
  order: number;

  ledgerid: string;
  ledgerName: string;
  ledgercategoryid: string;
  ledgerCategoryName: string;

  debit: number;
  credit: number;
  oppositeLedgers: readonly LedgerCategoryReportOppositeLedger[];

  runningDebit: number;
  runningCredit: number;
  balanceDebit: number;
  balanceCredit: number;
}>;

export type LedgerCategoryReportSummary = AccountingReportSummary;

export type LedgerCategoryReportCategory = Readonly<{
  ledgercategoryid: string;
  ledgerCategoryName: string;
}>;

export type LedgerCategoryReport = Readonly<{
  title: string;
  generatedAt: string;
  ledgerCategory: LedgerCategoryReportCategory;
  summary: LedgerCategoryReportSummary;
  data: readonly LedgerCategoryReportRow[];
}>;

export type LedgerCategoryReportQuery = {
  start?: string;
  end?: string;
};
