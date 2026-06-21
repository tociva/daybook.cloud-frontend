import { describe, expect, it } from 'vitest';
import {
  attachRunningBalances,
  computeRunningBalances,
  getOpeningBalanceForBank,
  hasDateLowerBound,
  periodFromFilter,
  stripPaginationFromQuery,
} from './bank-txn-running-balance.util';
import type { BankTxn } from './bank-txn.model';

describe('bank-txn-running-balance.util', () => {
  it('computes running balances from opening balance and transactions', () => {
    const openingBalances = [{ inventoryledgermapid: 'bank-1', balance: 500 }];
    const transactions = [
      { inventoryledgermapid: 'bank-1', debit: 0, credit: 200 },
      { inventoryledgermapid: 'bank-1', debit: 1000, credit: 0 },
    ];

    const result = computeRunningBalances(openingBalances, transactions);

    expect(result.get('bank-1')).toEqual([300, 1300]);
  });

  it('tracks multiple banks separately', () => {
    const openingBalances = [
      { inventoryledgermapid: 'bank-1', balance: 100 },
      { inventoryledgermapid: 'bank-2', balance: 200 },
    ];
    const transactions = [
      { inventoryledgermapid: 'bank-1', debit: 50, credit: 0 },
      { inventoryledgermapid: 'bank-2', debit: 0, credit: 25 },
      { inventoryledgermapid: 'bank-1', debit: 0, credit: 10 },
    ];

    const result = computeRunningBalances(openingBalances, transactions);

    expect(result.get('bank-1')).toEqual([150, 140]);
    expect(result.get('bank-2')).toEqual([175]);
  });

  it('defaults opening balance to zero when bank is missing', () => {
    expect(getOpeningBalanceForBank([], 'bank-1')).toBe(0);
    expect(
      computeRunningBalances([], [{ inventoryledgermapid: 'bank-1', debit: 100, credit: 0 }]).get(
        'bank-1',
      ),
    ).toEqual([100]);
  });

  it('attaches running balances to transaction rows', () => {
    const transactions: readonly BankTxn[] = [
      {
        id: 'txn-1',
        inventoryledgermapid: 'bank-1',
        txndate: '2025-06-05',
        debit: 0,
        credit: 200,
      },
      {
        id: 'txn-2',
        inventoryledgermapid: 'bank-1',
        txndate: '2025-06-15',
        debit: 1000,
        credit: 0,
      },
    ];

    const rows = attachRunningBalances(transactions, [
      { inventoryledgermapid: 'bank-1', balance: 500 },
    ]);

    expect(rows[0]?.balance).toBe(300);
    expect(rows[1]?.balance).toBe(1300);
  });

  it('detects date lower bounds in filters', () => {
    expect(hasDateLowerBound({ txndate: { gte: '2025-06-01' } })).toBe(true);
    expect(hasDateLowerBound({ txndate: { between: ['2025-06-01', '2025-06-30'] } })).toBe(true);
    expect(hasDateLowerBound({ txndate: { lte: '2025-06-30' } })).toBe(false);
    expect(hasDateLowerBound(undefined)).toBe(false);
  });

  it('derives period dates from filter where clauses', () => {
    expect(periodFromFilter({ txndate: { gte: '2025-06-01', lte: '2025-06-30' } })).toEqual({
      startDate: '2025-06-01',
      endDate: '2025-06-30',
    });
    expect(periodFromFilter({ txndate: { gte: '2025-06-01' } })).toEqual({
      startDate: '2025-06-01',
      endDate: undefined,
    });
    expect(periodFromFilter({ txndate: { between: ['2025-06-01', '2025-06-30'] } })).toEqual({
      startDate: '2025-06-01',
      endDate: '2025-06-30',
    });
    expect(periodFromFilter({ txndate: { lte: '2025-06-30' } })).toBeNull();
    expect(periodFromFilter(undefined)).toBeNull();
  });

  it('strips pagination fields from list queries', () => {
    expect(stripPaginationFromQuery({ limit: 10, offset: 20, where: { id: 'x' } })).toEqual({
      where: { id: 'x' },
    });
  });
});
