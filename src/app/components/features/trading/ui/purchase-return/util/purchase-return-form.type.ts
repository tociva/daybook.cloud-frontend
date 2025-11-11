import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { Currency } from "../../../../../shared/store/currency/currency.model";
import { PurchaseInvoice } from "../../../store/purchase-invoice/purchase-invoice.model";
import { Item } from "../../../store/item/item.model";
import { Tax } from "../../../store/tax";

export enum PurchaseReturnTaxDisplayModeType {
  NON_TAXABLE = 'Non Taxable',
  CGST_SGST = 'CGST SGST',
  IGST = 'IGST',
  CGST_SGST_CESS = 'CGST SGST With Cess',
  IGST_CESS = 'IGST With Cess',
}

export interface PurchaseReturnItemTaxForm {
  rate: FormControl<string | null>;
  appliedto: FormControl<number>;
  amount: FormControl<string | null>;
  name: FormControl<string>;
  shortname: FormControl<string>;
  tax: FormControl<Tax>;
}

export interface PurchaseReturnItemForm {
  name: FormControl<string>;
  description: FormControl<string | null>;
  code: FormControl<string>;
  price: FormControl<string | null>;
  quantity: FormControl<string | null>;
  itemtotal: FormControl<string | null>;
  taxes: FormArray<FormGroup<PurchaseReturnItemTaxForm>>;
  taxamount: FormControl<string | null>;
  grandtotal: FormControl<string | null>;
  item: FormControl<Item>;
}

export type PurchaseReturnPropertiesForm = {
  number: FormControl<string>;
  date: FormControl<string>;
  duedate: FormControl<string>;
  journal: FormControl<string>;
  currency: FormControl<Currency>;
  taxoption: FormControl<string>;
}

export type PurchaseReturnPropertiesFormValue = {
  number: string;
  date: string;
  duedate: string;
  journal: string;
  currency: Currency;
  taxoption: string;
}

export type PurchaseReturnSummaryForm = {
  itemtotal: FormControl<string | null>;
  tax: FormControl<string | null>;
  roundoff: FormControl<string | null>;
  grandtotal: FormControl<string | null>;
  words: FormControl<string | null>;
}

export type PurchaseReturnPurchaseInvoiceForm = {
  purchaseinvoice: FormControl<PurchaseInvoice>;
}

export type PurchaseReturnForm = {
  taxDisplayMode: FormControl<PurchaseReturnTaxDisplayModeType>;
  showDescription: FormControl<boolean>;
  purchaseinvoice: FormGroup<PurchaseReturnPurchaseInvoiceForm>;
  properties: FormGroup<PurchaseReturnPropertiesForm>;
  items: FormArray<FormGroup<PurchaseReturnItemForm>>;
  summary: FormGroup<PurchaseReturnSummaryForm>;
}

export type PurchaseReturnSummaryFormValue = {
  itemtotal: string;
  tax: string;
  roundoff: string;
  grandtotal: string;
  words: string;
}

export type PurchaseReturnPurchaseInvoiceFormValue = {
  purchaseinvoice: PurchaseInvoice;
}

export interface PurchaseReturnItemTaxFormValue {
  rate: number;
  appliedto: number;
  amount: number;
  name: string;
  shortname: string;
  tax: Tax;
}

export interface PurchaseReturnItemFormValue {
  name: string;
  displayname?: string;
  description?: string;
  code: string;
  price: string;
  quantity: string;
  itemtotal: string;
  taxes: PurchaseReturnItemTaxFormValue[];
  taxamount: string | null;
  grandtotal: string;
  item: Item;
}

export type PurchaseReturnFormValue = {
  taxDisplayMode: PurchaseReturnTaxDisplayModeType;
  showDescription: boolean;
  purchaseinvoice: PurchaseReturnPurchaseInvoiceFormValue;
  properties: PurchaseReturnPropertiesFormValue;
  items: PurchaseReturnItemFormValue[];
  summary: PurchaseReturnSummaryFormValue;
}

