import type { PurchaseReturn } from './purchase-return.model';

export type PurchaseReturnState = {
  count: number;
  error: string | null;
  isLoading: boolean;
  items: readonly PurchaseReturn[];
  selectedItem: PurchaseReturn | null;
};

export const initialPurchaseReturnState: { purchaseReturn: PurchaseReturnState } = {
  purchaseReturn: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
