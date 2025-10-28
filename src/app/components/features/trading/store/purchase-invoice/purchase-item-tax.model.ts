import { Tax } from "../tax/tax.model";
import { PurchaseItem } from "./purchase-item.model";

export interface PurchaseItemTaxCU {
  id?: string;
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
  purchaseitemid: string;
  taxid: string;
}

export interface PurchaseItemTax extends PurchaseItemTaxCU {
  tax: Tax;
  purchaseitem: PurchaseItem;
}

