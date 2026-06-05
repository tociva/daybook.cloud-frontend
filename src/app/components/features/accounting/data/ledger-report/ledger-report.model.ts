export type LedgerReportOppositeLedger = Readonly<{
  ledgerid: string;
  ledgerName: string;
}>;

export type LedgerReportRow = Readonly<{
  journalid: string;
  journalNumber: string;
  date: string;
  description?: string;
  order: number;
  debit: number;
  credit: number;
  oppositeLedgers: readonly LedgerReportOppositeLedger[];
  balanceDebit: number;
  balanceCredit: number;
}>;

import type { AccountingReportSummary } from '../../shared/accounting-report-summary.util';

export type LedgerReportSummary = AccountingReportSummary;

export type LedgerReportLedger = Readonly<{
  ledgerid: string;
  ledgerName: string;
}>;

export type LedgerReport = Readonly<{
  title: string;
  generatedAt: string;
  ledger: LedgerReportLedger;
  summary: LedgerReportSummary;
  data: readonly LedgerReportRow[];
}>;

export type LedgerReportQuery = {
  start?: string;
  end?: string;
};
