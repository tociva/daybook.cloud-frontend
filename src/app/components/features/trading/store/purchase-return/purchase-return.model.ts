// purchase-return.model.ts
import { Currency } from '../../../../shared/store/currency/currency.model';
import { PurchaseReturnTaxDisplayModeType } from '../../ui/purchase-return/util/purchase-return-form.type';
import { PurchaseInvoice } from '../purchase-invoice/purchase-invoice.model';
import { PurchaseReturnItem } from './purchase-return-item.model';

export type PurchaseReturnSystemProperties = {
  journal?: string;
} & Record<string, unknown>;

export type PurchaseReturnCustomProperties = {
  autoNumbering?: boolean;
  // Exchange rate
  fx?: number;
  // Amount in local currency
  lamt?: number;
  showdescription?: boolean;
  taxdisplaymode?: PurchaseReturnTaxDisplayModeType;
  taxoption?: string;
  deliverystate?: string;
} & Record<string, unknown>;

export interface PurchaseReturnCU {
  number: string;
  date: string;        // ISO date (YYYY-MM-DD)
  duedate: string;     // ISO date (YYYY-MM-DD)
  itemtotal: number;
  tax?: number;
  roundoff?: number;
  grandtotal: number;
  currencycode: string;
  cprops?: PurchaseReturnCustomProperties;
  sprops?: PurchaseReturnSystemProperties;
  description?: string;
  purchaseinvoiceid: string;
  items?: PurchaseReturnItem[];
}

export interface PurchaseReturn extends PurchaseReturnCU {
  id?: string;
  currency: Currency;
  purchaseinvoice: PurchaseInvoice;
}

