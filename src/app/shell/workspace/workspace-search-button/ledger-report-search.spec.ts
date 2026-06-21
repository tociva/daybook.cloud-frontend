import { describe, expect, it } from 'vitest';
import type { Ledger } from '../../../components/features/accounting/data/ledger';
import {
  buildLedgerReportSearchEntries,
  createLedgerReportSearchIndex,
  searchLedgerReportEntries,
} from './ledger-report-search';

function ledger(id: string | undefined, name: string): Ledger {
  return {
    id,
    name,
    categoryid: 'category-id',
  };
}

const dateQuery = { start: '2025-04-01', end: '2026-03-31' };

describe('ledger report search', () => {
  it('builds ledger report URLs with fiscal year date range', () => {
    const entries = buildLedgerReportSearchEntries(
      [ledger('3755f1d6-d1ef-4f76-855e-124094488908', 'Cash')],
      dateQuery,
    );

    expect(entries.map((entry) => entry.label)).toEqual(['Cash - Ledger report']);
    expect(entries.map((entry) => entry.description)).toEqual([
      'View ledger report for Cash.',
    ]);

    const [entry] = entries;
    const url = new URL(entry?.value ?? '', 'https://daybook.test');

    expect(url.pathname).toBe(
      '/app/accounting/reports/ledger/3755f1d6-d1ef-4f76-855e-124094488908',
    );
    expect(url.searchParams.get('start')).toBe('2025-04-01');
    expect(url.searchParams.get('end')).toBe('2026-03-31');
  });

  it('matches ledger names only and never returns entries for an empty query', () => {
    const index = createLedgerReportSearchIndex(
      [ledger('cash-id', 'Cash'), ledger('bank-id', 'Bank Account')],
      dateQuery,
    );

    expect(searchLedgerReportEntries(index, '')).toEqual([]);
    expect(searchLedgerReportEntries(index, 'Cash').map((entry) => entry.label)).toEqual([
      'Cash - Ledger report',
    ]);
    expect(searchLedgerReportEntries(index, 'ledger report')).toEqual([]);
  });

  it('skips ledgers without a usable id or name', () => {
    const entries = buildLedgerReportSearchEntries(
      [ledger(undefined, 'Missing Id'), ledger('blank-name', '   '), ledger('cash-id', ' Cash ')],
      dateQuery,
    );

    expect(entries.map((entry) => entry.label)).toEqual(['Cash - Ledger report']);
  });
});
