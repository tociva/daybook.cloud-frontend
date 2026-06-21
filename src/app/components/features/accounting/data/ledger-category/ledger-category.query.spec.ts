import { describe, expect, it } from 'vitest';
import type { LedgerCategory } from './ledger-category.model';
import { applyLedgerCategoryListQuery } from './ledger-category.query';

const categories: readonly LedgerCategory[] = [
  { id: 'assets', name: 'Assets', props: { type: 'Asset' } },
  {
    id: 'inventory',
    name: 'Inventory',
    parentid: 'assets',
    parent: { id: 'assets', name: 'Assets', props: { type: 'Asset' } },
  },
  { id: 'liabilities', name: 'Liabilities', props: { type: 'Liability' } },
  { id: 'capital', name: 'Capital / Equity', props: { type: 'Capital' } },
  {
    id: 'reserves',
    name: 'Reserves and Surplus',
    parentid: 'capital',
    parent: { id: 'capital', name: 'Capital / Equity', props: { type: 'Capital' } },
    props: { type: 'Reserves and Surplus' },
  },
  { id: 'legacy-equity', name: 'Legacy Equity', props: { type: 'Equity' } },
  { id: 'income', name: 'Income', props: { type: 'Income' } },
  { id: 'expense', name: 'Expense', props: { type: 'Expense' } },
  { id: 'mystery', name: 'Mystery' },
];

describe('applyLedgerCategoryListQuery', () => {
  it('orders cached ledger categories by Daybook accounting buckets by default', () => {
    expect(applyLedgerCategoryListQuery(categories).items.map((category) => category.id)).toEqual([
      'assets',
      'inventory',
      'liabilities',
      'capital',
      'legacy-equity',
      'reserves',
      'income',
      'expense',
      'mystery',
    ]);
  });

  it('keeps accounting buckets primary when a user sort is applied', () => {
    expect(
      applyLedgerCategoryListQuery(categories, {
        order: ['name DESC'],
      }).items.map((category) => category.id),
    ).toEqual([
      'inventory',
      'assets',
      'liabilities',
      'reserves',
      'legacy-equity',
      'capital',
      'income',
      'expense',
      'mystery',
    ]);
  });

  it('filters cached ledger categories by nested props.type values', () => {
    expect(
      applyLedgerCategoryListQuery(categories, {
        where: { 'props.type': 'Capital' },
      }).items.map((category) => category.id),
    ).toEqual(['capital']);

    expect(
      applyLedgerCategoryListQuery(categories, {
        where: { 'props.type': 'Reserves and Surplus' },
      }).items.map((category) => category.id),
    ).toEqual(['reserves']);
  });

  it('keeps legacy Equity records filterable from cached catalog data', () => {
    expect(
      applyLedgerCategoryListQuery(categories, {
        where: { 'props.type': 'Equity' },
      }).items.map((category) => category.id),
    ).toEqual(['legacy-equity']);
  });
});
