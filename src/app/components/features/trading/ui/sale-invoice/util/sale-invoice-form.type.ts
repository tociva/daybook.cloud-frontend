import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { Currency } from "../../../../../shared/store/currency/currency.model";
import { Customer } from "../../../store/customer";
import { Item } from "../../../store/item/item.model";
import { SaleInvoice } from "../../../store/sale-invoice/sale-invoice.model";

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

export interface SaleItemTaxForm {
  name: FormControl<string>;
  shortname: FormControl<string>;
  rate: FormControl<number>;
  appliedto: FormControl<number>;
  amount: FormControl<number>;
  saleitemid: FormControl<string>;
  taxid: FormControl<string>;
}

export interface SaleItemForm {
  name: FormControl<string>;
  description: FormControl<string | null>;
  order: FormControl<number>;
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
  saleinvoiceid: FormControl<string | null>;
  item: FormControl<Item>;
  itemid: FormControl<string>;
}

export type SaleInvoiceForm = {
  customer: FormControl<Customer | null>;

  // NOTE: now FormGroup, not FormControl<Address | null>
  billingaddress: FormGroup<AddressGroup>;
  billingaddressreadonly: FormControl<boolean>;
  shippingaddress: FormGroup<AddressGroup>;
  shippingaddressreadonly: FormControl<boolean>;
  useBillingForShipping: FormControl<boolean>;

  autoNumbering: FormControl<boolean>;
  number: FormControl<string>;
  date: FormControl<string>;
  duedate: FormControl<string>;
  currency: FormControl<Currency | null>;
  deliveryState: FormControl<string>;
  taxOption: FormControl<string>;
  showDescription: FormControl<boolean>;
  showDiscount: FormControl<boolean>;
  journal: FormControl<string>;

  itemtotal: FormControl<number>;
  discount: FormControl<number | null>;
  subtotal: FormControl<number>;
  tax: FormControl<number | null>;
  roundoff: FormControl<number | null>;
  grandtotal: FormControl<number>;
  description: FormControl<string | null>;

  items: FormArray<FormGroup<SaleItemForm>>;

};

export interface SaleInvoiceDAO extends SaleInvoice {

  billingaddressreadonly: boolean;
  shippingaddressreadonly: boolean;
  useBillingForShipping: boolean;
  autoNumbering: boolean;
  currency: Currency;
  deliveryState: string;
  taxOption: string;
  showDescription: boolean;
  showDiscount: boolean;
  journal: string;

}