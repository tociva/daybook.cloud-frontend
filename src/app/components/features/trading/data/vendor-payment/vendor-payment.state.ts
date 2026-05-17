import type { VendorPayment } from './vendor-payment.model';

export type VendorPaymentState = Readonly<{
  vendorPayment: Readonly<{
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly VendorPayment[];
    selectedItem: VendorPayment | null;
  }>;
}>;

export const initialVendorPaymentState: VendorPaymentState = {
  vendorPayment: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
