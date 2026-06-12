import {
  DEFAULT_LB4_PAGE_SIZE,
  applyCachedCrudListQuery,
  type CachedCrudQueryResult,
} from '../../../../../shared/crud';
import type { TaxGroup, TaxGroupListQuery } from './tax-group.model';

export type TaxGroupQueryResult = CachedCrudQueryResult<TaxGroup>;

export function applyTaxGroupListQuery(
  catalog: readonly TaxGroup[],
  query: TaxGroupListQuery = {},
  defaultLimit = DEFAULT_LB4_PAGE_SIZE,
): TaxGroupQueryResult {
  return applyCachedCrudListQuery(catalog, query, {
    defaultLimit,
    readSortValue,
  });
}

function readSortValue(taxGroup: TaxGroup, field: string): unknown {
  return field === 'rate' ? (taxGroup.rate ?? 0) : (taxGroup as Record<string, unknown>)[field] ?? '';
}
