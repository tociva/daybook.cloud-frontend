import { Tax } from "../tax/tax.model";
import { SaleItem } from "./sale-item.model";

export interface SaleItemTaxCU {
  id?: string;
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
  saleitemid: string;
  taxid: string;
}

export interface SaleItemTax extends SaleItemTaxCU {
  tax: Tax;
  saleitem: SaleItem;
}