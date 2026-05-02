import type { TaxGroup } from './tax-group.model';

export type TaxGroupState = Readonly<{
  taxGroup: Readonly<{
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly TaxGroup[];
    selectedItem: TaxGroup | null;
  }>;
}>;

export const initialTaxGroupState: TaxGroupState = {
  taxGroup: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};

