import { Item } from "../item";
import { PurchaseReturnItemTax } from "./purchase-return-item-tax.model";

export interface PurchaseReturnItem {
  id?: string;
  name: string;
  displayname: string;
  description?: string;
  order: number;
  code: string;
  price: number;
  quantity: number;
  itemtotal: number;
  taxes: PurchaseReturnItemTax[];
  taxamount?: number;
  grandtotal: number;
  purchasereturnid?: string;
  item: Item;
  itemid: string;
}

