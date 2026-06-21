import Fuse from 'fuse.js';
import type { LedgerCategory } from '../../../components/features/accounting/data/ledger-category';
import type { ReportDateQuery } from '../../../components/features/accounting/ui/reports/shared/report-date-query.util';

export type LedgerCategoryReportSearchEntry = Readonly<{
  categoryName: string;
  description: string;
  label: string;
  value: string;
}>;

export type LedgerCategoryReportSearchIndex = Readonly<{
  entries: readonly LedgerCategoryReportSearchEntry[];
  fuse: Fuse<LedgerCategoryReportSearchEntry>;
}>;

export const LEDGER_CATEGORY_REPORT_SEARCH_LIMIT = 10;

export function buildLedgerCategoryReportSearchUrl(
  categoryId: string,
  dateQuery?: ReportDateQuery,
): string {
  const base = `/app/accounting/reports/ledger-category/${categoryId}`;
  if (!dateQuery?.start || !dateQuery?.end) return base;
  return `${base}?start=${dateQuery.start}&end=${dateQuery.end}`;
}

export function buildLedgerCategoryReportSearchEntries(
  categories: readonly LedgerCategory[],
  dateQuery?: ReportDateQuery,
): readonly LedgerCategoryReportSearchEntry[] {
  return categories.flatMap((category) => {
    const categoryId = category.id?.trim();
    const categoryName = category.name?.trim();

    if (!categoryId || !categoryName) return [];

    return [
      {
        categoryName,
        description: `View ledger category report for ${categoryName}.`,
        label: `${categoryName} - Ledger category report`,
        value: buildLedgerCategoryReportSearchUrl(categoryId, dateQuery),
      },
    ];
  });
}

export function createLedgerCategoryReportSearchIndex(
  categories: readonly LedgerCategory[],
  dateQuery?: ReportDateQuery,
): LedgerCategoryReportSearchIndex {
  const entries = buildLedgerCategoryReportSearchEntries(categories, dateQuery);

  return {
    entries,
    fuse: new Fuse(entries, {
      keys: [{ name: 'categoryName', weight: 1 }],
      threshold: 0.35,
      includeScore: false,
      ignoreLocation: true,
    }),
  };
}

export function searchLedgerCategoryReportEntries(
  index: LedgerCategoryReportSearchIndex,
  query: string,
  limit = LEDGER_CATEGORY_REPORT_SEARCH_LIMIT,
): readonly LedgerCategoryReportSearchEntry[] {
  const q = query.trim();
  if (!q) return [];

  return index.fuse.search(q, { limit }).map((result) => result.item);
}
