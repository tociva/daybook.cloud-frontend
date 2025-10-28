import { Branch } from '../../../management/store/branch/branch.model';
import { Currency } from '../../../../shared/store/currency/currency.model';
import { Customer } from '../customer/customer.model';
import { BankCash } from '../bank-cash/bank-cash.model';

export interface SaleInvoiceReceipt {
  id?: string;
  customerreceiptid: string;
  saleinvoiceid: string;
  amount: number;
}

export interface CustomerReceiptCustomProperties {
  [key: string]: unknown;
}

export interface CustomerReceiptSystemProperties {
  [key: string]: unknown;
}

export interface CustomerReceiptCU {
  date: Date | string;
  amount: number;
  currencycode: string;
  customerid: string;
  bcashid: string;
  description?: string;
  cprops?: CustomerReceiptCustomProperties;
  sprops?: CustomerReceiptSystemProperties;
}

export interface CustomerReceipt extends CustomerReceiptCU {
  id?: string;
  currency?: Currency;
  customer?: Customer;
  bcash?: BankCash;
  invoices?: SaleInvoiceReceipt[];
  branch?: Branch;
  branchid: string;
}

