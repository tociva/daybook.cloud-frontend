import { describe, expect, it } from 'vitest';
import type { Ledger } from './ledger.model';
import { applyLedgerListQuery } from './ledger.query';

const ledgers: readonly Ledger[] = [
  {
    id: 'sales',
    name: 'Sales',
    categoryid: 'income',
    category: { id: 'income', name: 'Income', props: { type: 'Income' } },
    openingdr: 700,
  },
  {
    id: 'cash',
    name: 'Cash',
    categoryid: 'assets',
    category: { id: 'assets', name: 'Assets', props: { type: 'Asset' } },
    openingdr: 100,
  },
  {
    id: 'loan',
    name: 'Loan',
    categoryid: 'liabilities',
    category: { id: 'liabilities', name: 'Liabilities', props: { type: 'Liability' } },
    openingdr: 900,
  },
  {
    id: 'bank',
    name: 'Bank',
    categoryid: 'assets',
    category: { id: 'assets', name: 'Assets', props: { type: 'Asset' } },
    openingdr: 200,
  },
  {
    id: 'owner-capital',
    name: 'Owner Capital',
    categoryid: 'capital',
    category: { id: 'capital', name: 'Capital / Equity', props: { type: 'Capital' } },
    openingdr: 800,
  },
  {
    id: 'legacy-equity',
    name: 'Legacy Equity',
    categoryid: 'legacy-equity',
    category: { id: 'legacy-equity', name: 'Legacy Equity', props: { type: 'Equity' } },
    openingdr: 600,
  },
  {
    id: 'rent',
    name: 'Rent',
    categoryid: 'expense',
    category: { id: 'expense', name: 'Expense', props: { type: 'Expense' } },
    openingdr: 500,
  },
  {
    id: 'misc',
    name: 'Misc',
    categoryid: 'mystery',
    category: { id: 'mystery', name: 'Mystery' },
    openingdr: 1000,
  },
];

describe('applyLedgerListQuery', () => {
  it('orders cached ledgers by their category accounting bucket by default', () => {
    expect(applyLedgerListQuery(ledgers).items.map((ledger) => ledger.id)).toEqual([
      'bank',
      'cash',
      'loan',
      'legacy-equity',
      'owner-capital',
      'sales',
      'rent',
      'misc',
    ]);
  });

  it('keeps accounting buckets primary when a user sort is applied', () => {
    expect(
      applyLedgerListQuery(ledgers, {
        order: ['openingdr DESC'],
      }).items.map((ledger) => ledger.id),
    ).toEqual(['bank', 'cash', 'loan', 'owner-capital', 'legacy-equity', 'sales', 'rent', 'misc']);
  });
});
