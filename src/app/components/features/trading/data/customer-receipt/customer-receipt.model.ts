import type { Lb4Include, Lb4ListQuery } from '../../../../../shared/crud';
import type { BankCash } from '../bank-cash/bank-cash.model';
import type { Customer } from '../customer/customer.model';
import type { SaleInvoice } from '../sale-invoice/sale-invoice.model';

// ── Embedded sale-invoice link ───────────────────────────────────────────────

export type SaleInvoiceReceipt = Readonly<{
  id?: string;
  customerreceiptid?: string;
  saleinvoiceid?: string;
  saleinvoice?: SaleInvoice;
  amount: number;
}>;

// ── API request payload ───────────────────────────────────────────────────────

export type CustomerReceiptInvoiceRequest = Readonly<{
  saleinvoiceid: string;
  amount: number;
}>;

export type CustomerReceiptPayload = Readonly<{
  date: string;
  amount: number;
  currencycode: string;
  customerid: string;
  bcashid: string;
  description?: string;
  invoices?: readonly CustomerReceiptInvoiceRequest[];
}>;

// ── Read model ────────────────────────────────────────────────────────────────

export type CustomerReceipt = Readonly<{
  id?: string;
  date: string;
  amount: number;
  currencycode?: string;
  customerid?: string;
  bcashid?: string;
  description?: string;
  customer?: Customer;
  bcash?: BankCash;
  invoices?: readonly SaleInvoiceReceipt[];
  branchid?: string;
}>;

// ── Query types ───────────────────────────────────────────────────────────────

export type CustomerReceiptListQuery = Lb4ListQuery;
export type CustomerReceiptGetQuery = Readonly<{ includes?: readonly Lb4Include[] }>;
