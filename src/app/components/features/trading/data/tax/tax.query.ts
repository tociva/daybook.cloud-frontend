import {
  DEFAULT_LB4_PAGE_SIZE,
  applyCachedCrudListQuery,
  type CachedCrudQueryResult,
} from '../../../../../shared/crud';
import type { Tax, TaxListQuery } from './tax.model';

export type TaxQueryResult = CachedCrudQueryResult<Tax>;

export function applyTaxListQuery(
  catalog: readonly Tax[],
  query: TaxListQuery = {},
  defaultLimit = DEFAULT_LB4_PAGE_SIZE,
): TaxQueryResult {
  return applyCachedCrudListQuery(catalog, query, {
    defaultLimit,
    readSortValue,
  });
}

function readSortValue(tax: Tax, field: string): unknown {
  switch (field) {
    case 'rate':
    case 'appliedto':
    case 'status':
      return (tax as Record<string, unknown>)[field] ?? 0;
    default:
      return (tax as Record<string, unknown>)[field] ?? '';
  }
}
