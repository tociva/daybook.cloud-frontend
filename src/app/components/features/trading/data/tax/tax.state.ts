import type { Tax } from './tax.model';

export type TaxState = Readonly<{
  tax: Readonly<{
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly Tax[];
    selectedItem: Tax | null;
  }>;
}>;

export const initialTaxState: TaxState = {
  tax: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
