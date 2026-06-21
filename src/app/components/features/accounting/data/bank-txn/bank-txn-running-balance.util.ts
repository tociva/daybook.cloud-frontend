import type { BankTxn, BankTxnListPeriod, BankTxnOpeningBalance } from './bank-txn.model';

export function getOpeningBalanceForBank(
  openingBalances: readonly BankTxnOpeningBalance[],
  mapId: string,
): number {
  return openingBalances.find((entry) => entry.inventoryledgermapid === mapId)?.balance ?? 0;
}

export function computeRunningBalances(
  openingBalances: readonly BankTxnOpeningBalance[],
  transactions: readonly Pick<BankTxn, 'inventoryledgermapid' | 'debit' | 'credit'>[],
): Map<string, number[]> {
  const openingByBank = new Map(
    openingBalances.map((entry) => [entry.inventoryledgermapid, entry.balance]),
  );
  const runningByBank = new Map<string, number>();
  const result = new Map<string, number[]>();

  for (const txn of transactions) {
    const bankId = txn.inventoryledgermapid;
    if (!runningByBank.has(bankId)) {
      runningByBank.set(bankId, openingByBank.get(bankId) ?? 0);
    }

    const next =
      (runningByBank.get(bankId) ?? 0) + (txn.debit ?? 0) - (txn.credit ?? 0);
    runningByBank.set(bankId, next);

    if (!result.has(bankId)) {
      result.set(bankId, []);
    }
    result.get(bankId)!.push(next);
  }

  return result;
}

export function attachRunningBalances(
  transactions: readonly BankTxn[],
  openingBalances: readonly BankTxnOpeningBalance[],
): readonly BankTxn[] {
  const runningByBank = computeRunningBalances(openingBalances, transactions);
  const indexByBank = new Map<string, number>();

  return transactions.map((txn) => {
    const bankId = txn.inventoryledgermapid;
    const index = indexByBank.get(bankId) ?? 0;
    indexByBank.set(bankId, index + 1);
    const balances = runningByBank.get(bankId);
    const balance = balances?.[index];

    return balance === undefined ? txn : { ...txn, balance };
  });
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
