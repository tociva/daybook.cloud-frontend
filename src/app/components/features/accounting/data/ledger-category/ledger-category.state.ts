import type { LedgerCategory } from './ledger-category.model';

export type LedgerCategoryState = Readonly<{
  ledgerCategory: Readonly<{
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly LedgerCategory[];
    selectedItem: LedgerCategory | null;
  }>;
}>;

export const initialLedgerCategoryState: LedgerCategoryState = {
  ledgerCategory: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
