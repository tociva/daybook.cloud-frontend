import {
  DEFAULT_LB4_PAGE_SIZE,
  applyCachedCrudListQuery,
  type CachedCrudQueryResult,
} from '../../../../../shared/crud';
import type { Ledger, LedgerListQuery } from './ledger.model';

export type LedgerQueryResult = CachedCrudQueryResult<Ledger>;

export function applyLedgerListQuery(
  catalog: readonly Ledger[],
  query: LedgerListQuery = {},
  defaultLimit = DEFAULT_LB4_PAGE_SIZE,
): LedgerQueryResult {
  return applyCachedCrudListQuery(catalog, query, {
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
