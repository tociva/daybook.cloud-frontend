import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { Currency } from "../../../../../shared/store/currency/currency.model";
import { Customer } from "../../../store/customer";
import { Item } from "../../../store/item/item.model";
import { Tax } from "../../../store/tax";
import { Address } from "../../../../../../util/types/address";

export enum SaleInvoiceTaxDisplayModeType {
  NON_TAXABLE = 'Non Taxable',
  CGST_SGST = 'CGST SGST',
  IGST = 'IGST',
  CGST_SGST_CESS = 'CGST SGST With Cess',
  IGST_CESS = 'IGST With Cess',
}

export interface SaleItemTaxFormValue {
  rate: number;
  appliedto: number;
  amount: number;
  name: string;
  shortname: string;
  tax: Tax;
}
export interface SaleItemFormValue {
  name: string;
  displayname?: string;
  description?: string;
  code: string;
  price: number;
  quantity: number;
  itemtotal: number;
  discpercent: number | null;
  discamount: number | null;
  subtotal: number;
  taxes: SaleItemTaxFormValue[];
  taxamount: number | null;
  grandtotal: number;
  item: Item;
}
export interface SaleItemTaxForm {
  rate: FormControl<string | null>;
  appliedto: FormControl<number>;
  amount: FormControl<string | null>;
  name: FormControl<string>;
  shortname: FormControl<string>;
  tax: FormControl<Tax>;
}
export interface SaleItemForm {
  name: FormControl<string>;
  description: FormControl<string | null>;
  code: FormControl<string>;
  price: FormControl<string | null>;
  quantity: FormControl<string | null>;
  itemtotal: FormControl<string | null>;
  discpercent: FormControl<string | null>;
  discamount: FormControl<string | null>;
  subtotal: FormControl<string | null>;
  taxes: FormArray<FormGroup<SaleItemTaxForm>>;
  taxamount: FormControl<string | null>;
  grandtotal: FormControl<string | null>;
  item: FormControl<Item>;
}

export type SaleInvoicePropertiesForm = {
  number: FormControl<string>;
  date: FormControl<string>;
  duedate: FormControl<string>;
  journal: FormControl<string>;
  currency: FormControl<Currency>;
  deliverystate: FormControl<string>;
  autoNumbering: FormControl<boolean>;
  taxoption: FormControl<string>;
}

export type SaleInvoicePropertiesFormValue = {
  number: string;
  date: string;
  duedate: string;
  journal: string;
  currency: Currency;
  deliverystate: string;
  autoNumbering: boolean;
  taxoption: string;
}

export type SaleInvoiceSummaryForm = {
  itemtotal: FormControl<string | null>;
  discount: FormControl<string | null>;
  subtotal: FormControl<string | null>;
  tax: FormControl<string | null>;
  roundoff: FormControl<string | null>;
  grandtotal: FormControl<string | null>;
  words: FormControl<string | null>;
}

export type SaleInvoiceSummaryFormValue = {
  itemtotal: number;
  discount: number;
  subtotal: number;
  tax: number;
  roundoff: number;
  grandtotal: number;
  words: string;
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

export type SaleInvoiceCustomerForm = {
  customer: FormControl<Customer>;
  billingaddress: FormGroup<AddressGroup>;
  shippingaddress: FormGroup<AddressGroup>;
  useBillingForShipping: FormControl<boolean>;
}

export type SaleInvoiceCustomerFormValue = {
  customer: Customer;
  billingaddress: Address;
  shippingaddress: Address;
  useBillingForShipping: boolean;
}

export type SaleInvoiceForm = {
  taxDisplayMode: FormControl<SaleInvoiceTaxDisplayModeType>;
  showDiscount: FormControl<boolean>;
  showDescription: FormControl<boolean>;
  customer: FormGroup<SaleInvoiceCustomerForm>;
  properties: FormGroup<SaleInvoicePropertiesForm>;
  items: FormArray<FormGroup<SaleItemForm>>;
  summary: FormGroup<SaleInvoiceSummaryForm>;
}

export type SaleInvoiceFormValue = {
  customer: SaleInvoiceCustomerFormValue;
  properties: SaleInvoicePropertiesFormValue;
  items: SaleItemFormValue[];
  summary: SaleInvoiceSummaryFormValue;
}