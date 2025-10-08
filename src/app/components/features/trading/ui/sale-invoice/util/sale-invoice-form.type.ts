import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { Customer } from "../../../store/customer";
import { Item } from "../../../store/item/item.model";
import { SaleItemTax } from "../../../store/sale-invoice/sale-item-tax.model";
import { Currency } from "../../../../../shared/store/currency/currency.model";

export interface SaleItemTaxForm {
  rate: FormControl<number>;
  appliedto: FormControl<number>;
  amount: FormControl<number>;
  name: FormControl<string>;
  shortname: FormControl<string>;
  tax: FormControl<SaleItemTax>;
}
export interface SaleItemForm {
  name: FormControl<string>;
  description: FormControl<string | null>;
  code: FormControl<string>;
  price: FormControl<number>;
  quantity: FormControl<number>;
  itemtotal: FormControl<number>;
  discpercent: FormControl<number | null>;
  discamount: FormControl<number | null>;
  subtotal: FormControl<number>;
  taxes: FormArray<FormGroup<SaleItemTaxForm>>;
  taxamount: FormControl<number | null>;
  grandtotal: FormControl<number>;
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

export type SaleInvoiceSummaryForm = {
  itemtotal: FormControl<number>;
  discount: FormControl<number | null>;
  subtotal: FormControl<number>;
  tax: FormControl<number | null>;
  roundoff: FormControl<number | null>;
  grandtotal: FormControl<number>;
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

export type SaleInvoiceForm = {
  customer: FormGroup<SaleInvoiceCustomerForm>;
  properties: FormGroup<SaleInvoicePropertiesForm>;
}
// items: FormArray<FormGroup<SaleItemForm>>;
// summary: FormGroup<SaleInvoiceSummaryForm>;