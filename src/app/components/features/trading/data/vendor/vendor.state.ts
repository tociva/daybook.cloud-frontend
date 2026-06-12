import { createInitialCachedCrudState, type CachedCrudState } from '../../../../../shared/crud';
import type { Vendor } from './vendor.model';

type VendorState = {
  vendor: {
    catalog: CachedCrudState<Vendor>['catalog'];
    catalogLoaded: CachedCrudState<Vendor>['catalogLoaded'];
    catalogTotalCount: CachedCrudState<Vendor>['catalogTotalCount'];
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly Vendor[];
    selectedItem: Vendor | null;
  };
};

export const initialVendorState: VendorState = {
  vendor: {
    ...createInitialCachedCrudState<Vendor>(),
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
