import { Address } from "../../../../../util/types/address";
import { PurchaseInvoiceCustomProperties } from "./purchase-invoice.model";

export interface PurchaseInvoiceItemTaxRequest {
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
  taxid: string; // format: uuid
}

export interface PurchaseInvoiceItemRequest {
  name: string;
  displayname?: string; // default: ''
  description?: string; // default: ''
  order: number;
  code: string;
  price: number;
  quantity: number;
  itemtotal: number;
  discpercent?: number; // default: 0
  discamount?: number; // default: 0
  subtotal: number;
  taxamount?: number; // default: 0
  grandtotal: number;
  itemid: string; // format: uuid
  taxes?: PurchaseInvoiceItemTaxRequest[];
}

export interface PurchaseInvoiceRequest {
  number?: string;
  date: string; // format: date
  duedate: string; // format: date
  itemtotal: number;
  discount?: number; // default: 0
  subtotal: number;
  tax?: number; // default: 0
  roundoff?: number; // default: 0
  grandtotal: number;
  currencycode: string;
  cprops?: PurchaseInvoiceCustomProperties; // default: {}
  description?: string; // default: ''
  vendorid: string; // format: uuid
  items: PurchaseInvoiceItemRequest[];
}

