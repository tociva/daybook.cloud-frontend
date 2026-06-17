import type { Lb4Include, Lb4ListQuery } from '../../../../../shared/crud';
import type { BankCash } from '../bank-cash/bank-cash.model';
import type { Vendor } from '../vendor/vendor.model';
import type { PurchaseInvoice } from '../purchase-invoice/purchase-invoice.model';

// ── Embedded purchase-invoice link ────────────────────────────────────────────

export type PurchaseInvoicePayment = Readonly<{
  id?: string;
  vendorpaymentid?: string;
  purchaseinvoiceid?: string;
  purchaseinvoice?: PurchaseInvoice;
  amount: number;
}>;

// ── API request payload ───────────────────────────────────────────────────────

export type VendorPaymentInvoiceRequest = Readonly<{
  purchaseinvoiceid: string;
  amount: number;
}>;

export type VendorPaymentPayload = Readonly<{
  date: string;
  amount: number;
  currencycode: string;
  vendorid: string;
  bcashid: string;
  description?: string;
  invoices?: readonly VendorPaymentInvoiceRequest[];
}>;

// ── Minimal journal ref (mirrors CustomerReceiptJournal) ────────────────────

export type VendorPaymentJournal = Readonly<{
  id: string;
  number: string;
}>;

// ── Read model ────────────────────────────────────────────────────────────────

export type VendorPayment = Readonly<{
  id?: string;
  number?: string;
  date: string;
  amount: number;
  currencycode?: string;
  vendorid?: string;
  bcashid?: string;
  description?: string;
  vendor?: Vendor;
  bcash?: BankCash;
  invoices?: readonly PurchaseInvoicePayment[];
  branchid?: string;
}>;

// ── Query types ───────────────────────────────────────────────────────────────

export type VendorPaymentListQuery = Lb4ListQuery;
export type VendorPaymentGetQuery = Readonly<{ includes?: readonly Lb4Include[] }>;
