export interface SaleItemTax {
  id?: string;
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
  saleitemid: string;
  taxid: string;
}