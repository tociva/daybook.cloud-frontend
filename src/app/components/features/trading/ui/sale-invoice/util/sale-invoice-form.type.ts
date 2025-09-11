import { FormControl, FormGroup } from "@angular/forms";
import { Customer } from "../../../store/customer";
import { Currency } from "../../../../../shared/store/currency/currency.model";
import { TaxOptions } from "../../../../../../util/types/tax-options.type";

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

export type SaleInvoiceForm = {
  customer: FormControl<Customer | null>;

  // NOTE: now FormGroup, not FormControl<Address | null>
  billingaddress: FormGroup<AddressGroup>;
  shippingaddress: FormGroup<AddressGroup>;
  useBillingForShipping: FormControl<boolean>;

  autoNumbering: FormControl<boolean>;
  number: FormControl<string>;
  date: FormControl<string>;
  duedate: FormControl<string>;
  currency: FormControl<Currency | null>;
  deliveryState: FormControl<string>;
  taxOption: FormControl<TaxOptions>;
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
};