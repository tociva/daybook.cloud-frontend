import { describe, expect, it } from 'vitest';
import {
  getOpeningBalanceForBank,
  hasDateLowerBound,
  periodFromFilter,
  stripPaginationFromQuery,
} from './bank-txn-running-balance.util';

describe('bank-txn-running-balance.util', () => {
  it('defaults opening balance to zero when bank is missing', () => {
    expect(getOpeningBalanceForBank([], 'bank-1')).toBe(0);
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
