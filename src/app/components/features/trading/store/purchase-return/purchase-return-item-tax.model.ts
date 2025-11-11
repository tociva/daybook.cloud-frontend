import { Tax } from "../tax/tax.model";
import { PurchaseReturnItem } from "./purchase-return-item.model";

export interface PurchaseReturnItemTaxCU {
  id?: string;
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
  purchasereturnitemid: string;
  taxid: string;
}

export interface PurchaseReturnItemTax extends PurchaseReturnItemTaxCU {
  tax: Tax;
  purchasereturnitem: PurchaseReturnItem;
}

