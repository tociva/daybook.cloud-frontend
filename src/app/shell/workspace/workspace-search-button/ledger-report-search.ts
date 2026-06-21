import Fuse from 'fuse.js';
import type { Ledger } from '../../../components/features/accounting/data/ledger';
import type { ReportDateQuery } from '../../../components/features/accounting/ui/reports/shared/report-date-query.util';

export type LedgerReportSearchEntry = Readonly<{
  description: string;
  label: string;
  ledgerName: string;
  value: string;
}>;

export type LedgerReportSearchIndex = Readonly<{
  entries: readonly LedgerReportSearchEntry[];
  fuse: Fuse<LedgerReportSearchEntry>;
}>;

export const LEDGER_REPORT_SEARCH_LIMIT = 10;

export function buildLedgerReportSearchUrl(
  ledgerId: string,
  dateQuery?: ReportDateQuery,
): string {
  const base = `/app/accounting/reports/ledger/${ledgerId}`;
  if (!dateQuery?.start || !dateQuery?.end) return base;
  return `${base}?start=${dateQuery.start}&end=${dateQuery.end}`;
}

export function buildLedgerReportSearchEntries(
  ledgers: readonly Ledger[],
  dateQuery?: ReportDateQuery,
): readonly LedgerReportSearchEntry[] {
  return ledgers.flatMap((ledger) => {
    const ledgerId = ledger.id?.trim();
    const ledgerName = ledger.name?.trim();

    if (!ledgerId || !ledgerName) return [];

    return [
      {
        description: `View ledger report for ${ledgerName}.`,
        label: `${ledgerName} - Ledger report`,
        ledgerName,
        value: buildLedgerReportSearchUrl(ledgerId, dateQuery),
      },
    ];
  });
}

export function createLedgerReportSearchIndex(
  ledgers: readonly Ledger[],
  dateQuery?: ReportDateQuery,
): LedgerReportSearchIndex {
  const entries = buildLedgerReportSearchEntries(ledgers, dateQuery);

  return {
    entries,
    fuse: new Fuse(entries, {
      keys: [{ name: 'ledgerName', weight: 1 }],
      threshold: 0.35,
      includeScore: false,
      ignoreLocation: true,
    }),
  };
}

export function searchLedgerReportEntries(
  index: LedgerReportSearchIndex,
  query: string,
  limit = LEDGER_REPORT_SEARCH_LIMIT,
): readonly LedgerReportSearchEntry[] {
  const q = query.trim();
  if (!q) return [];

  return index.fuse.search(q, { limit }).map((result) => result.item);
}
