import { CustomerReceiptCustomProperties, CustomerReceiptSystemProperties, SaleInvoiceReceipt } from "../../store/customer-receipt/customer-receipt.model";

export interface CustomerReceiptRequest {
  date: Date | string;
  amount: number;
  currencycode: string;
  customerid: string;
  bcashid: string;
  description?: string;
  cprops?: CustomerReceiptCustomProperties;
  invoices?: Array<{
    saleinvoiceid: string;
    amount: number;
  }>;
}