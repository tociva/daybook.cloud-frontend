import type { BankTxnListPeriod, BankTxnOpeningBalance } from './bank-txn.model';

export function getOpeningBalanceForBank(
  openingBalances: readonly BankTxnOpeningBalance[],
  mapId: string,
): number {
  return openingBalances.find((entry) => entry.inventoryledgermapid === mapId)?.balance ?? 0;
}

export function hasDateLowerBound(where: Record<string, unknown> | undefined): boolean {
  if (!where) return false;

  const txndate = where['txndate'];
  if (!txndate || typeof txndate !== 'object') return false;

  const dateFilter = txndate as Record<string, unknown>;
  if (typeof dateFilter['gte'] === 'string') return true;

  const between = dateFilter['between'];
  return Array.isArray(between) && between.length > 0 && typeof between[0] === 'string';
}

export function periodFromFilter(
  where: Record<string, unknown> | undefined,
): BankTxnListPeriod | null {
  if (!where) return null;

  const txndate = where['txndate'];
  if (!txndate || typeof txndate !== 'object') return null;

  const dateFilter = txndate as Record<string, unknown>;

  if (typeof dateFilter['gte'] === 'string') {
    return {
      startDate: dateFilter['gte'],
      endDate: typeof dateFilter['lte'] === 'string' ? dateFilter['lte'] : undefined,
    };
  }

  const between = dateFilter['between'];
  if (Array.isArray(between) && between.length > 0 && typeof between[0] === 'string') {
    return {
      startDate: between[0],
      endDate: typeof between[1] === 'string' ? between[1] : undefined,
    };
  }

  return null;
}

export function stripPaginationFromQuery<T extends { limit?: number; offset?: number }>(
  query: T,
): Omit<T, 'limit' | 'offset'> {
  const { limit: _limit, offset: _offset, ...rest } = query;
  return rest;
}
