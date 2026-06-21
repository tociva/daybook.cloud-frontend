import type {
  LedgerCategory,
  LedgerCategoryCapitalChildType,
  LedgerCategoryRootType,
} from './ledger-category.model';
import {
  LEDGER_CATEGORY_CAPITAL_CHILD_TYPES,
  LEDGER_CATEGORY_LEGACY_TYPES,
  LEDGER_CATEGORY_ROOT_TYPES,
} from './ledger-category.model';

const CAPITAL_ROOT_TYPE: LedgerCategoryRootType = 'Capital';

export type LedgerCategoryClassificationValidation = Readonly<{
  parent: LedgerCategory | null | undefined;
  parentId: string;
  type: string;
  typeFieldEditable: boolean;
}>;

export function findLedgerCategoryById(
  categories: readonly LedgerCategory[],
  id: string,
): LedgerCategory | null {
  return categories.find((category) => category.id === id) ?? null;
}

export function isCapitalRootCategory(category: LedgerCategory | null | undefined): boolean {
  return category?.props?.type === CAPITAL_ROOT_TYPE;
}

export function isLedgerCategoryRootType(value: string): value is LedgerCategoryRootType {
  return (LEDGER_CATEGORY_ROOT_TYPES as readonly string[]).includes(value);
}

export function isLedgerCategoryCapitalChildType(
  value: string,
): value is LedgerCategoryCapitalChildType {
  return (LEDGER_CATEGORY_CAPITAL_CHILD_TYPES as readonly string[]).includes(value);
}

export function isLedgerCategoryLegacyType(value: string): boolean {
  return (LEDGER_CATEGORY_LEGACY_TYPES as readonly string[]).includes(value);
}

export function isLedgerCategoryTypeFieldEditable(
  parentId: string,
  parent: LedgerCategory | null | undefined,
): boolean {
  return parentId.trim() === '' || isCapitalRootCategory(parent);
}

export function getLedgerCategoryTypeOptions(
  parentId: string,
  parent: LedgerCategory | null | undefined,
): readonly string[] {
  if (parentId.trim() === '') {
    return LEDGER_CATEGORY_ROOT_TYPES;
  }

  return isCapitalRootCategory(parent) ? LEDGER_CATEGORY_CAPITAL_CHILD_TYPES : [];
}

export function normalizeTypeAfterParentChange(
  type: string,
  previousParentId: string,
  nextParentId: string,
  nextParent: LedgerCategory | null | undefined,
): string {
  const normalizedType = type.trim();
  const normalizedPreviousParentId = previousParentId.trim();
  const normalizedNextParentId = nextParentId.trim();

  if (normalizedNextParentId === '') {
    return isLedgerCategoryRootType(normalizedType) ? normalizedType : '';
  }

  if (isCapitalRootCategory(nextParent)) {
    return isLedgerCategoryCapitalChildType(normalizedType) ? normalizedType : '';
  }

  return normalizedNextParentId === normalizedPreviousParentId ? normalizedType : '';
}

export function validateLedgerCategoryClassification(
  validation: LedgerCategoryClassificationValidation,
): string | null {
  const type = validation.type.trim();
  const parentId = validation.parentId.trim();

  if (!type) return null;

  if (!parentId) {
    return isLedgerCategoryRootType(type) || isLedgerCategoryLegacyType(type)
      ? null
      : 'Root categories can only use Asset, Liability, Capital, Income, or Expense.';
  }

  if (isLedgerCategoryCapitalChildType(type)) {
    return isCapitalRootCategory(validation.parent)
      ? null
      : 'Capital child types must be direct children of Capital / Equity.';
  }

  if (!validation.typeFieldEditable) return null;

  if (isLedgerCategoryRootType(type) || isLedgerCategoryLegacyType(type)) {
    return 'Root category types can only be used without a parent category.';
  }

  return 'Only Capital child types can be set directly under Capital / Equity.';
}
