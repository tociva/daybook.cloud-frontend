import { PurchaseReturnCustomProperties } from "./purchase-return.model";

export interface PurchaseReturnItemTaxRequest {
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
  taxid: string; // format: uuid
}

export interface PurchaseReturnItemRequest {
  name: string;
  displayname?: string; // default: ''
  description?: string; // default: ''
  order: number;
  code: string;
  price: number;
  quantity: number;
  itemtotal: number;
  taxamount?: number; // default: 0
  grandtotal: number;
  itemid: string; // format: uuid
  taxes?: PurchaseReturnItemTaxRequest[];
}

export interface PurchaseReturnRequest {
  number?: string;
  date: string; // format: date
  duedate: string; // format: date
  itemtotal: number;
  tax?: number; // default: 0
  roundoff?: number; // default: 0
  grandtotal: number;
  currencycode: string;
  cprops?: PurchaseReturnCustomProperties; // default: {}
  description?: string; // default: ''
  purchaseinvoiceid: string; // format: uuid
  items: PurchaseReturnItemRequest[];
}

