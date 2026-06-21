import {
  DEFAULT_LB4_PAGE_SIZE,
  applyCachedCrudListQuery,
  type CachedCrudSort,
  type CachedCrudQueryResult,
} from '../../../../../shared/crud';
import type { LedgerCategory, LedgerCategoryListQuery } from './ledger-category.model';
import {
  buildLedgerCategoryLookup,
  compareAccountingText,
  compareLedgerCategoryAccountingRanks,
  type LedgerCategoryLookup,
} from './ledger-category.ordering';

export type LedgerCategoryQueryResult = CachedCrudQueryResult<LedgerCategory>;

export function applyLedgerCategoryListQuery(
  catalog: readonly LedgerCategory[],
  query: LedgerCategoryListQuery = {},
  defaultLimit = DEFAULT_LB4_PAGE_SIZE,
): LedgerCategoryQueryResult {
  const categoriesById = buildLedgerCategoryLookup(catalog);

  return applyCachedCrudListQuery(catalog, query, {
    compareRows: (left, right, sort) =>
      compareLedgerCategoryRows(left, right, sort, categoriesById),
    defaultLimit,
    readFieldValue,
    readSortValue,
  });
}

function readFieldValue(category: LedgerCategory, field: string): unknown {
  switch (field) {
    case 'parent':
      return category.parent?.name ?? '';
    case 'props.type':
    case 'type':
      return category.props?.type ?? '';
    default:
      return (category as Record<string, unknown>)[field] ?? '';
  }
}

function readSortValue(category: LedgerCategory, field: string): unknown {
  return readFieldValue(category, field);
}

function compareLedgerCategoryRows(
  left: LedgerCategory,
  right: LedgerCategory,
  sort: CachedCrudSort | null,
  categoriesById: LedgerCategoryLookup,
): number {
  return (
    compareLedgerCategoryAccountingRanks(left, right, categoriesById) ||
    compareRequestedSort(left, right, sort) ||
    compareAccountingText(left.name, right.name) ||
    compareAccountingText(left.id, right.id)
  );
}

function compareRequestedSort(
  left: LedgerCategory,
  right: LedgerCategory,
  sort: CachedCrudSort | null,
): number {
  if (!sort) return 0;

  const direction = sort.direction === 'DESC' ? -1 : 1;
  return (
    compareSortValues(readSortValue(left, sort.field), readSortValue(right, sort.field)) * direction
  );
}

function compareSortValues(left: unknown, right: unknown): number {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return compareAccountingText(left, right);
}
