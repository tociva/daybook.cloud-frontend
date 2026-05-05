import type { Customer } from './customer.model';

type CustomerState = {
  customer: {
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly Customer[];
    selectedItem: Customer | null;
  };
};

export const initialCustomerState: CustomerState = {
  customer: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
