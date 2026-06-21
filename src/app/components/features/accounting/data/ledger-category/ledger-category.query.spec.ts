import { describe, expect, it } from 'vitest';
import type { LedgerCategory } from './ledger-category.model';
import { applyLedgerCategoryListQuery } from './ledger-category.query';

const categories: readonly LedgerCategory[] = [
  { id: 'assets', name: 'Assets', props: { type: 'Asset' } },
  { id: 'capital', name: 'Capital / Equity', props: { type: 'Capital' } },
  {
    id: 'reserves',
    name: 'Reserves and Surplus',
    parentid: 'capital',
    parent: { id: 'capital', name: 'Capital / Equity', props: { type: 'Capital' } },
    props: { type: 'Reserves and Surplus' },
  },
  { id: 'legacy-equity', name: 'Legacy Equity', props: { type: 'Equity' } },
];

describe('applyLedgerCategoryListQuery', () => {
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
