import type { Lb4ListQuery } from '../../../../../shared/crud';

export type LedgerCategoryRootType = 'Asset' | 'Liability' | 'Capital' | 'Income' | 'Expense';

export type LedgerCategoryCapitalChildType =
  | 'Owner Capital'
  | 'Current Year Profit'
  | 'Drawings'
  | 'Reserves and Surplus';

export type LedgerCategoryLegacyType = 'Equity';

export type LedgerCategoryKnownType =
  | LedgerCategoryRootType
  | LedgerCategoryCapitalChildType
  | LedgerCategoryLegacyType;

export type LedgerCategoryType = LedgerCategoryKnownType | (string & {});

export const LEDGER_CATEGORY_ROOT_TYPES: readonly LedgerCategoryRootType[] = [
  'Asset',
  'Liability',
  'Capital',
  'Income',
  'Expense',
];

export const LEDGER_CATEGORY_CAPITAL_CHILD_TYPES: readonly LedgerCategoryCapitalChildType[] = [
  'Owner Capital',
  'Current Year Profit',
  'Drawings',
  'Reserves and Surplus',
];

export const LEDGER_CATEGORY_LEGACY_TYPES: readonly LedgerCategoryLegacyType[] = ['Equity'];

export const LEDGER_CATEGORY_TYPES: readonly LedgerCategoryKnownType[] = [
  ...LEDGER_CATEGORY_ROOT_TYPES,
  ...LEDGER_CATEGORY_CAPITAL_CHILD_TYPES,
];

export const LEDGER_CATEGORY_FILTER_TYPES: readonly LedgerCategoryKnownType[] = [
  ...LEDGER_CATEGORY_TYPES,
  ...LEDGER_CATEGORY_LEGACY_TYPES,
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
