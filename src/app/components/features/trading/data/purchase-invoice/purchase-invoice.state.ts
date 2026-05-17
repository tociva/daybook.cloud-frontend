import type { PurchaseInvoice } from './purchase-invoice.model';

export type PurchaseInvoiceState = {
  count: number;
  error: string | null;
  isLoading: boolean;
  items: readonly PurchaseInvoice[];
  selectedItem: PurchaseInvoice | null;
};

export const initialPurchaseInvoiceState: { purchaseInvoice: PurchaseInvoiceState } = {
  purchaseInvoice: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
