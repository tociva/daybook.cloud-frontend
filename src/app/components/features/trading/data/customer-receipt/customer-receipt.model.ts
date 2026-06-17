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

export type CustomerReceiptCustomProperties = Readonly<{
  autoNumbering?: boolean;
  fx?: number;
  lamt?: number;
  [key: string]: unknown;
}>;

export type CustomerReceiptSystemProperties = Readonly<{
  [key: string]: unknown;
}>;

export type CustomerReceiptPayload = Readonly<{
  number?: string;
  date: string;
  amount: number;
  currencycode: string;
  customerid: string;
  bcashid: string;
  cprops?: CustomerReceiptCustomProperties;
  sprops?: CustomerReceiptSystemProperties;
  description?: string;
  invoices?: readonly CustomerReceiptInvoiceRequest[];
}>;

// ── Minimal journal ref (mirrors SaleInvoiceJournal) ────────────────────────

export type CustomerReceiptJournal = Readonly<{
  id: string;
  number: string;
}>;

// ── Read model ────────────────────────────────────────────────────────────────

export type CustomerReceipt = Readonly<{
  id?: string;
  number?: string;
  date: string;
  amount: number;
  currencycode?: string;
  customerid?: string;
  bcashid?: string;
  cprops?: CustomerReceiptCustomProperties;
  sprops?: CustomerReceiptSystemProperties;
  description?: string;
  customer?: Customer;
  bcash?: BankCash;
  invoices?: readonly SaleInvoiceReceipt[];
  branchid?: string;
}>;

// ── Query types ───────────────────────────────────────────────────────────────

export type CustomerReceiptListQuery = Lb4ListQuery;
export type CustomerReceiptGetQuery = Readonly<{ includes?: readonly Lb4Include[] }>;

export const CUSTOMER_RECEIPT_DETAIL_INCLUDES = [
  'customer',
  'bcash',
  { relation: 'invoices', scope: { include: [{ relation: 'saleinvoice' }] } },
] as const satisfies readonly Lb4Include[];
