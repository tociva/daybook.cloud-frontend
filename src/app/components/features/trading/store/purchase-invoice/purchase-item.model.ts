import { Item } from "../item";
import { PurchaseItemTax } from "./purchase-item-tax.model";

export interface PurchaseItem {
  id?: string;
  name: string;
  displayname: string;
  description?: string;
  order: number;
  code: string;
  price: number;
  quantity: number;
  itemtotal: number;
  discpercent?: number;
  discamount?: number;
  subtotal: number;
  taxes: PurchaseItemTax[];
  taxamount?: number;
  grandtotal: number;
  purchaseinvoiceid?: string;
  item: Item;
  itemid: string;
}

