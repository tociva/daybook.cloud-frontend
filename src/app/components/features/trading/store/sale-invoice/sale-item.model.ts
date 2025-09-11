import { Item } from "../item";
import { SaleItemTax } from "./sale-item-tax.model";

export interface SaleItem {

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
  taxes: SaleItemTax[];
  taxamount?: number;
  grandtotal: number;
  saleinvoiceid?: string;
  item: Item;
  itemid: string;

}
