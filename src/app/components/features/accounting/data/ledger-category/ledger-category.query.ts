import {
  DEFAULT_LB4_PAGE_SIZE,
  applyCachedCrudListQuery,
  type CachedCrudQueryResult,
} from '../../../../../shared/crud';
import type { LedgerCategory, LedgerCategoryListQuery } from './ledger-category.model';

export type LedgerCategoryQueryResult = CachedCrudQueryResult<LedgerCategory>;

export function applyLedgerCategoryListQuery(
  catalog: readonly LedgerCategory[],
  query: LedgerCategoryListQuery = {},
  defaultLimit = DEFAULT_LB4_PAGE_SIZE,
): LedgerCategoryQueryResult {
  return applyCachedCrudListQuery(catalog, query, {
    defaultLimit,
    readFieldValue,
    readSortValue,
  });
}

function readFieldValue(category: LedgerCategory, field: string): unknown {
  switch (field) {
    case 'parent':
      return category.parent?.name ?? '';
    default:
      return (category as Record<string, unknown>)[field] ?? '';
  }
}

function readSortValue(category: LedgerCategory, field: string): unknown {
  return readFieldValue(category, field);
}
