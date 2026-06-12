import { createInitialCachedCrudState, type CachedCrudState } from '../../../../../shared/crud';
import type { TaxGroup } from './tax-group.model';

export type TaxGroupState = Readonly<{
  taxGroup: CachedCrudState<TaxGroup> &
    Readonly<{
      count: number;
      error: string | null;
      isLoading: boolean;
      items: readonly TaxGroup[];
      selectedItem: TaxGroup | null;
    }>;
}>;

export const initialTaxGroupState: TaxGroupState = {
  taxGroup: {
    ...createInitialCachedCrudState<TaxGroup>(),
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
