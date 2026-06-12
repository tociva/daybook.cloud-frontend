import { createInitialCachedCrudState, type CachedCrudState } from '../../../../../shared/crud';
import type { Customer } from './customer.model';

type CustomerState = {
  customer: {
    catalog: CachedCrudState<Customer>['catalog'];
    catalogLoaded: CachedCrudState<Customer>['catalogLoaded'];
    catalogTotalCount: CachedCrudState<Customer>['catalogTotalCount'];
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly Customer[];
    selectedItem: Customer | null;
  };
};

export const initialCustomerState: CustomerState = {
  customer: {
    ...createInitialCachedCrudState<Customer>(),
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
