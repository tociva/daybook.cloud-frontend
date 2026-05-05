import type { CustomerReceipt } from './customer-receipt.model';

export type CustomerReceiptState = Readonly<{
  customerReceipt: Readonly<{
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly CustomerReceipt[];
    selectedItem: CustomerReceipt | null;
  }>;
}>;

export const initialCustomerReceiptState: CustomerReceiptState = {
  customerReceipt: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
