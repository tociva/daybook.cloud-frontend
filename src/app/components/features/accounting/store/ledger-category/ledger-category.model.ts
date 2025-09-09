
export enum LedgerCategoryType {
  Asset = 'Asset',
  Liability = 'Liability',
  Equity = 'Equity',
  Income = 'Income',
  Expense = 'Expense'
}

export interface LedgerCategoryCU {
  name: string;
  description?: string;
  props?: {
    type?: LedgerCategoryType;
  } & Record<string, unknown>;
  parentid?: string;
}

export interface LedgerCategory extends LedgerCategoryCU {
  id?: string;
  parent?: LedgerCategory;
  children?: LedgerCategory[];
}
