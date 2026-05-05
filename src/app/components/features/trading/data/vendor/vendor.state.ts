import type { Vendor } from './vendor.model';

type VendorState = {
  vendor: {
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly Vendor[];
    selectedItem: Vendor | null;
  };
};

export const initialVendorState: VendorState = {
  vendor: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
