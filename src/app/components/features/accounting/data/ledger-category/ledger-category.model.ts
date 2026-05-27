import type { Lb4ListQuery } from '../../../../../shared/crud';

export type LedgerCategoryType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

export const LEDGER_CATEGORY_TYPES: readonly LedgerCategoryType[] = [
  'Asset',
  'Liability',
  'Equity',
  'Income',
  'Expense',
];

export type LedgerCategoryProps = Readonly<{
  type?: LedgerCategoryType;
}>;

export type LedgerCategoryPayload = Readonly<{
  name: string;
  description?: string;
  props?: LedgerCategoryProps;
  parentid?: string | null;
}>;

export type LedgerCategory = LedgerCategoryPayload &
  Readonly<{
    id?: string;
    parent?: LedgerCategory;
    children?: readonly LedgerCategory[];
  }>;

export type LedgerCategoryListQuery = Lb4ListQuery;

export type LedgerCategoryGetQuery = Readonly<{
  includes?: readonly string[];
}>;
