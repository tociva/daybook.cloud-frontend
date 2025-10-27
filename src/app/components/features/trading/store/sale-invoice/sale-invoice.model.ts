// sale-invoice.model.ts
import { Address } from '../../../../../util/types/address';
import { Currency } from '../../../../shared/store/currency/currency.model';
import { SaleInvoiceTaxDisplayModeType } from '../../ui/sale-invoice/util/sale-invoice-form.type';
import { Customer } from '../customer';
import { SaleItem } from './sale-item.model';

export type SaleInvoiceSystemProperties = {
  journal?: string;
} & Record<string, unknown>;

export type SaleInvoiceCustomProperties = {
  autoNumbering?: boolean;
  // Exchange rate
  fx?: number;
  // Amount in local currency
  lamt?: number;
  receipts?: Array<{
    id: string;
    date: string;
    amount: number;
  }>;
  showdiscount?: boolean;
  showdescription?: boolean;
  taxdisplaymode?: SaleInvoiceTaxDisplayModeType;
  usebillingforshipping?: boolean;
  taxoption?: string;
  deliverystate?: string;
} & Record<string, unknown>;


export interface SaleInvoiceCU {
  number: string;
  date: string;        // ISO date (YYYY-MM-DD)
  duedate: string;     // ISO date (YYYY-MM-DD)
  itemtotal: number;
  discount?: number;
  subtotal: number;
  tax?: number;
  roundoff?: number;
  grandtotal: number;
  currencycode: string;
  billingaddress: Address;
  shippingaddress: Address;
  cprops?: SaleInvoiceCustomProperties;
  sprops?: SaleInvoiceSystemProperties;
  description?: string;
  customerid: string;
  items?: SaleItem[];
}

export interface SaleInvoice extends SaleInvoiceCU {
  id?: string;
  currency: Currency;
  customer: Customer;
}
