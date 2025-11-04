import { VendorPaymentCustomProperties, VendorPaymentSystemProperties } from "../../store/vendor-payment/vendor-payment.model";

export interface VendorPaymentRequest {
  date: Date | string;
  amount: number;
  currencycode: string;
  vendorid: string;
  bcashid: string;
  description?: string;
  cprops?: VendorPaymentCustomProperties;
  invoices?: Array<{
    purchaseinvoiceid: string;
    amount: number;
  }>;
}

