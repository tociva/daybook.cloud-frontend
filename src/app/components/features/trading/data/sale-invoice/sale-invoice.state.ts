import type { SaleInvoice } from './sale-invoice.model';

export type SaleInvoiceState = {
  count: number;
  error: string | null;
  isLoading: boolean;
  items: readonly SaleInvoice[];
  selectedItem: SaleInvoice | null;
};

export const initialSaleInvoiceState: { saleInvoice: SaleInvoiceState } = {
  saleInvoice: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
