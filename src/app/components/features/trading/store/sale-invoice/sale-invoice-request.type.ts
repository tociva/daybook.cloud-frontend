import { Address } from "../../../../../util/types/address";
import { SaleInvoiceCustomProperties } from "./sale-invoice.model";

export interface SaleInvoiceItemTaxRequest {
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
  taxid?: string; // format: uuid
}

export interface SaleInvoiceItemRequest {
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
  taxes?: SaleInvoiceItemTaxRequest[];
}

export interface SaleInvoiceRequest {
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
  billingaddress: Address;
  shippingaddress: Address;
  cprops?: SaleInvoiceCustomProperties; // default: {}
  description?: string; // default: ''
  customerid: string; // format: uuid
  items: SaleInvoiceItemRequest[];
}
