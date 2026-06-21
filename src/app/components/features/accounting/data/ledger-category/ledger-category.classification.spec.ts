import { describe, expect, it } from 'vitest';
import type { LedgerCategory } from './ledger-category.model';
import {
  getLedgerCategoryTypeOptions,
  isCapitalRootCategory,
  isLedgerCategoryTypeFieldEditable,
  normalizeTypeAfterParentChange,
  validateLedgerCategoryClassification,
} from './ledger-category.classification';

const capitalRoot: LedgerCategory = {
  id: 'capital',
  name: 'Capital / Equity',
  props: { type: 'Capital' },
};

const assetRoot: LedgerCategory = {
  id: 'asset',
  name: 'Assets',
  props: { type: 'Asset' },
};

const ownerCapital: LedgerCategory = {
  id: 'owner-capital',
  name: 'Owner Capital',
  parentid: 'capital',
  parent: capitalRoot,
  props: { type: 'Owner Capital' },
};

describe('ledger category classification helpers', () => {
  it('offers Capital as a root type and hides legacy Equity from create choices', () => {
    expect(getLedgerCategoryTypeOptions('', null)).toContain('Capital');
    expect(getLedgerCategoryTypeOptions('', null)).not.toContain('Equity');
    expect(
      validateLedgerCategoryClassification({
        parent: null,
        parentId: '',
        type: 'Capital',
        typeFieldEditable: true,
      }),
    ).toBeNull();

    expect(
      validateLedgerCategoryClassification({
        parent: null,
        parentId: '',
        type: 'Equity',
        typeFieldEditable: true,
      }),
    ).toBeNull();
  });

  it('recognizes direct Capital roots and offers Capital child types below them', () => {
    expect(isCapitalRootCategory(capitalRoot)).toBe(true);
    expect(isLedgerCategoryTypeFieldEditable('capital', capitalRoot)).toBe(true);
    expect(getLedgerCategoryTypeOptions('capital', capitalRoot)).toEqual([
      'Owner Capital',
      'Current Year Profit',
      'Drawings',
      'Reserves and Surplus',
    ]);
  });

  it('requires typed Capital children to use the Capital root as direct parent', () => {
    expect(
      validateLedgerCategoryClassification({
        parent: capitalRoot,
        parentId: 'capital',
        type: 'Owner Capital',
        typeFieldEditable: true,
      }),
    ).toBeNull();

    expect(
      validateLedgerCategoryClassification({
        parent: assetRoot,
        parentId: 'asset',
        type: 'Owner Capital',
        typeFieldEditable: false,
      }),
    ).toBe('Capital child types must be direct children of Capital / Equity.');
  });

  it('allows untyped descendants under Capital', () => {
    expect(
      validateLedgerCategoryClassification({
        parent: ownerCapital,
        parentId: 'owner-capital',
        type: '',
        typeFieldEditable: false,
      }),
    ).toBeNull();
  });

  it('preserves non-editable existing child types when the parent is unchanged', () => {
    expect(
      normalizeTypeAfterParentChange('Current Asset', 'asset', 'asset', assetRoot),
    ).toBe('Current Asset');
    expect(isLedgerCategoryTypeFieldEditable('asset', assetRoot)).toBe(false);
  });
});
