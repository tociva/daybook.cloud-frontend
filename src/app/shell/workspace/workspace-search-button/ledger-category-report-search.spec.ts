import { describe, expect, it } from 'vitest';
import type { LedgerCategory } from '../../../components/features/accounting/data/ledger-category';
import {
  buildLedgerCategoryReportSearchEntries,
  createLedgerCategoryReportSearchIndex,
  searchLedgerCategoryReportEntries,
} from './ledger-category-report-search';

function category(id: string | undefined, name: string): LedgerCategory {
  return {
    id,
    name,
  };
}

const dateQuery = { start: '2025-04-01', end: '2026-03-31' };

describe('ledger category report search', () => {
  it('builds ledger category report URLs with fiscal year date range', () => {
    const entries = buildLedgerCategoryReportSearchEntries(
      [category('271c5582-b401-4752-a828-47950f7b15e7', 'Current Assets')],
      dateQuery,
    );

    expect(entries.map((entry) => entry.label)).toEqual([
      'Current Assets - Ledger category report',
    ]);
    expect(entries.map((entry) => entry.description)).toEqual([
      'View ledger category report for Current Assets.',
    ]);

    const [entry] = entries;
    const url = new URL(entry?.value ?? '', 'https://daybook.test');

    expect(url.pathname).toBe(
      '/app/accounting/reports/ledger-category/271c5582-b401-4752-a828-47950f7b15e7',
    );
    expect(url.searchParams.get('start')).toBe('2025-04-01');
    expect(url.searchParams.get('end')).toBe('2026-03-31');
  });

  it('matches category names only and never returns entries for an empty query', () => {
    const index = createLedgerCategoryReportSearchIndex(
      [category('assets-id', 'Current Assets'), category('liability-id', 'Current Liabilities')],
      dateQuery,
    );

    expect(searchLedgerCategoryReportEntries(index, '')).toEqual([]);
    expect(
      searchLedgerCategoryReportEntries(index, 'Current Assets').map((entry) => entry.label),
    ).toEqual(['Current Assets - Ledger category report']);
    expect(searchLedgerCategoryReportEntries(index, 'ledger category report')).toEqual([]);
  });

  it('skips categories without a usable id or name', () => {
    const entries = buildLedgerCategoryReportSearchEntries(
      [
        category(undefined, 'Missing Id'),
        category('blank-name', '   '),
        category('assets-id', ' Current Assets '),
      ],
      dateQuery,
    );

    expect(entries.map((entry) => entry.label)).toEqual([
      'Current Assets - Ledger category report',
    ]);
  });
});
