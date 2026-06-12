import { createInitialCachedCrudState, type CachedCrudState } from '../../../../../shared/crud';
import type { Tax } from './tax.model';

export type TaxState = Readonly<{
  tax: CachedCrudState<Tax> &
    Readonly<{
      count: number;
      error: string | null;
      isLoading: boolean;
      items: readonly Tax[];
      selectedItem: Tax | null;
    }>;
}>;

export const initialTaxState: TaxState = {
  tax: {
    ...createInitialCachedCrudState<Tax>(),
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
