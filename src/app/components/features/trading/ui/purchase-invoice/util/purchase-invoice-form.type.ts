import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { Currency } from "../../../../../shared/store/currency/currency.model";
import { Vendor } from "../../../store/vendor";
import { Item } from "../../../store/item/item.model";
import { Tax } from "../../../store/tax";
import { Address } from "../../../../../../util/types/address";

export enum PurchaseInvoiceTaxDisplayModeType {
  NON_TAXABLE = 'Non Taxable',
  CGST_SGST = 'CGST SGST',
  IGST = 'IGST',
  CGST_SGST_CESS = 'CGST SGST With Cess',
  IGST_CESS = 'IGST With Cess',
}

export interface PurchaseItemTaxForm {
  rate: FormControl<string | null>;
  appliedto: FormControl<number>;
  amount: FormControl<string | null>;
  name: FormControl<string>;
  shortname: FormControl<string>;
  tax: FormControl<Tax>;
}

export interface PurchaseItemForm {
  name: FormControl<string>;
  description: FormControl<string | null>;
  code: FormControl<string>;
  price: FormControl<string | null>;
  quantity: FormControl<string | null>;
  itemtotal: FormControl<string | null>;
  discpercent: FormControl<string | null>;
  discamount: FormControl<string | null>;
  subtotal: FormControl<string | null>;
  taxes: FormArray<FormGroup<PurchaseItemTaxForm>>;
  taxamount: FormControl<string | null>;
  grandtotal: FormControl<string | null>;
  item: FormControl<Item>;
}

export type PurchaseInvoicePropertiesForm = {
  number: FormControl<string>;
  date: FormControl<string>;
  duedate: FormControl<string>;
  journal: FormControl<string>;
  currency: FormControl<Currency>;
  taxoption: FormControl<string>;
}

export type PurchaseInvoicePropertiesFormValue = {
  number: string;
  date: string;
  duedate: string;
  journal: string;
  currency: Currency;
  taxoption: string;
}

export type PurchaseInvoiceSummaryForm = {
  itemtotal: FormControl<string | null>;
  discount: FormControl<string | null>;
  subtotal: FormControl<string | null>;
  tax: FormControl<string | null>;
  roundoff: FormControl<string | null>;
  grandtotal: FormControl<string | null>;
  words: FormControl<string | null>;
}

export type AddressGroup = {
  name: FormControl<string>;
  line1: FormControl<string>;
  line2: FormControl<string | null>;
  street: FormControl<string>;
  city: FormControl<string>;
  state: FormControl<string>;
  zip: FormControl<string>;
  country: FormControl<string>;
  mobile: FormControl<string | null>;
  email: FormControl<string | null>;
};

export type PurchaseInvoiceVendorForm = {
  vendor: FormControl<Vendor>;
  vendoraddress: FormGroup<AddressGroup>;
}

export type PurchaseInvoiceForm = {
  taxDisplayMode: FormControl<PurchaseInvoiceTaxDisplayModeType>;
  showDiscount: FormControl<boolean>;
  showDescription: FormControl<boolean>;
  vendor: FormGroup<PurchaseInvoiceVendorForm>;
  properties: FormGroup<PurchaseInvoicePropertiesForm>;
  items: FormArray<FormGroup<PurchaseItemForm>>;
  summary: FormGroup<PurchaseInvoiceSummaryForm>;
}

export type PurchaseInvoiceSummaryFormValue = {
  itemtotal: string;
  discount: string;
  subtotal: string;
  tax: string;
  roundoff: string;
  grandtotal: string;
  words: string;
}

export type PurchaseInvoiceVendorFormValue = {
  vendor: Vendor;
  vendoraddress: Address;
}

export interface PurchaseItemTaxFormValue {
  rate: number;
  appliedto: number;
  amount: number;
  name: string;
  shortname: string;
  tax: Tax;
}

export interface PurchaseItemFormValue {
  name: string;
  displayname?: string;
  description?: string;
  code: string;
  price: string;
  quantity: string;
  itemtotal: string;
  discpercent: string | null;
  discamount: string | null;
  subtotal: string;
  taxes: PurchaseItemTaxFormValue[];
  taxamount: string | null;
  grandtotal: string;
  item: Item;
}

export type PurchaseInvoiceFormValue = {
  taxDisplayMode: PurchaseInvoiceTaxDisplayModeType;
  showDiscount: boolean;
  showDescription: boolean;
  vendor: PurchaseInvoiceVendorFormValue;
  properties: PurchaseInvoicePropertiesFormValue;
  items: PurchaseItemFormValue[];
  summary: PurchaseInvoiceSummaryFormValue;
}

