// purchase-invoice.model.ts
import { Address } from '../../../../../util/types/address';
import { Currency } from '../../../../shared/store/currency/currency.model';
import { PurchaseInvoiceTaxDisplayModeType } from '../../ui/purchase-invoice/util/purchase-invoice-form.type';
import { Vendor } from '../vendor';
import { PurchaseItem } from './purchase-item.model';

export type PurchaseInvoiceSystemProperties = {
  journal?: string;
} & Record<string, unknown>;

export type PurchaseInvoiceCustomProperties = {
  autoNumbering?: boolean;
  // Exchange rate
  fx?: number;
  // Amount in local currency
  lamt?: number;
  payments?: Array<{
    id: string;
    date: string;
    amount: number;
  }>;
  showdiscount?: boolean;
  showdescription?: boolean;
  taxdisplaymode?: PurchaseInvoiceTaxDisplayModeType;
  taxoption?: string;
  sourcestate?: string;
} & Record<string, unknown>;

export interface PurchaseInvoiceCU {
  number: string;
  date: string;        // ISO date (YYYY-MM-DD)
  duedate: string;     // ISO date (YYYY-MM-DD)
  currencycode: string;
  itemtotal: number;
  discount?: number;
  subtotal: number;
  tax?: number;
  roundoff?: number;
  grandtotal: number;
  vendoraddress: Address;
  cprops?: PurchaseInvoiceCustomProperties;
  sprops?: PurchaseInvoiceSystemProperties;
  description?: string;
  vendorid: string;
  items?: PurchaseItem[];
}

export interface PurchaseInvoice extends PurchaseInvoiceCU {
  id?: string;
  currency: Currency;
  vendor: Vendor;
}

