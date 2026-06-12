import { createInitialCachedCrudState, type CachedCrudState } from '../../../../../shared/crud';
import type { LedgerCategory } from './ledger-category.model';

export type LedgerCategoryState = Readonly<{
  ledgerCategory: CachedCrudState<LedgerCategory> &
    Readonly<{
      count: number;
      error: string | null;
      isLoading: boolean;
      items: readonly LedgerCategory[];
      selectedItem: LedgerCategory | null;
    }>;
}>;

export const initialLedgerCategoryState: LedgerCategoryState = {
  ledgerCategory: {
    ...createInitialCachedCrudState<LedgerCategory>(),
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
