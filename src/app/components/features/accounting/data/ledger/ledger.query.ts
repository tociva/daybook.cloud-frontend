import {
  DEFAULT_LB4_PAGE_SIZE,
  applyCachedCrudListQuery,
  type CachedCrudSort,
  type CachedCrudQueryResult,
} from '../../../../../shared/crud';
import type { Ledger, LedgerListQuery } from './ledger.model';
import type { LedgerCategory } from '../ledger-category/ledger-category.model';
import {
  buildLedgerCategoryLookup,
  compareAccountingText,
  compareLedgerAccountingRanks,
  type LedgerCategoryLookup,
} from '../ledger-category/ledger-category.ordering';

export type LedgerQueryResult = CachedCrudQueryResult<Ledger>;

export function applyLedgerListQuery(
  catalog: readonly Ledger[],
  query: LedgerListQuery = {},
  defaultLimit = DEFAULT_LB4_PAGE_SIZE,
): LedgerQueryResult {
  const categoriesById = buildLedgerCategoryLookup(readLedgerCategories(catalog));

  return applyCachedCrudListQuery(catalog, query, {
    compareRows: (left, right, sort) => compareLedgerRows(left, right, sort, categoriesById),
    defaultLimit,
    readFieldValue: readLedgerFieldValue,
    readSortValue: readLedgerSortValue,
  });
}

function readLedgerFieldValue(ledger: Ledger, field: string): unknown {
  switch (field) {
    case 'category':
      return ledger.category?.name ?? '';
    default:
      return (ledger as Record<string, unknown>)[field] ?? '';
  }
}

function readLedgerSortValue(ledger: Ledger, field: string): unknown {
  switch (field) {
    case 'openingdr':
      return ledger.openingdr ?? 0;
    case 'openingcr':
      return ledger.openingcr ?? 0;
    default:
      return readLedgerFieldValue(ledger, field);
  }
}

function compareLedgerRows(
  left: Ledger,
  right: Ledger,
  sort: CachedCrudSort | null,
  categoriesById: LedgerCategoryLookup,
): number {
  return (
    compareLedgerAccountingRanks(left, right, categoriesById) ||
    compareRequestedSort(left, right, sort) ||
    compareAccountingText(left.name, right.name) ||
    compareAccountingText(left.id, right.id)
  );
}

function compareRequestedSort(left: Ledger, right: Ledger, sort: CachedCrudSort | null): number {
  if (!sort) return 0;

  const direction = sort.direction === 'DESC' ? -1 : 1;
  return (
    compareSortValues(
      readLedgerSortValue(left, sort.field),
      readLedgerSortValue(right, sort.field),
    ) * direction
  );
}

function compareSortValues(left: unknown, right: unknown): number {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return compareAccountingText(left, right);
}

function readLedgerCategories(catalog: readonly Ledger[]): LedgerCategory[] {
  const categories: LedgerCategory[] = [];
  for (const ledger of catalog) {
    if (ledger.category) categories.push(ledger.category);
  }
  return categories;
}
