import { Branch } from '../../../management/store/branch/branch.model';
import { Currency } from '../../../../shared/store/currency/currency.model';
import { Vendor } from '../vendor/vendor.model';
import { BankCash } from '../bank-cash/bank-cash.model';
import { PurchaseInvoice } from '../purchase-invoice/purchase-invoice.model';

export interface PurchaseInvoicePayment {
  id?: string;
  vendorpaymentid: string;
  purchaseinvoice?: PurchaseInvoice | null;
  amount: number;
}

export interface VendorPaymentCustomProperties {
  [key: string]: unknown;
}

export interface VendorPaymentSystemProperties {
  [key: string]: unknown;
}

export interface VendorPaymentCU {
  date: Date | string;
  amount: number;
  currencycode: string;
  vendorid: string;
  bcashid: string;
  description?: string;
  cprops?: VendorPaymentCustomProperties;
  sprops?: VendorPaymentSystemProperties;
}

export interface VendorPayment extends VendorPaymentCU {
  id?: string;
  currency?: Currency;
  vendor?: Vendor;
  bcash?: BankCash;
  invoices?: PurchaseInvoicePayment[];
  branch?: Branch;
  branchid: string;
}

