import { inject, Injectable } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { Address } from "../../../../../../util/types/address";
import { Customer } from "../../../store/customer/customer.model";
import { AddressGroup, SaleInvoiceCustomerForm, SaleInvoiceForm } from "./sale-invoice-form.type";

@Injectable({ providedIn: 'root' })
export class SaleInvoiceFormService { 
  private fb = inject(FormBuilder);



 private buildAddressGroup(seed?: Partial<Address>) {
  return this.fb.group<AddressGroup>({
    name: this.fb.control(seed?.name ?? '', { nonNullable: true }),
    line1: this.fb.control(seed?.line1 ?? '', { nonNullable: true, validators: [Validators.required] }),
    line2: this.fb.control(seed?.line2 ?? null),
    street: this.fb.control(seed?.street ?? '', { nonNullable: true }),
    city: this.fb.control(seed?.city ?? '', { nonNullable: true }),
    state: this.fb.control(seed?.state ?? '', { nonNullable: true }),
    zip: this.fb.control(seed?.zip ?? '', { nonNullable: true }),
    country: this.fb.control(seed?.country ?? '', { nonNullable: true }),
    mobile: this.fb.control(seed?.mobile ?? null),
    email: this.fb.control(seed?.email ?? null, { validators: [] }),
  });
}

  readonly createSaleInvoiceForm = () => this.fb.nonNullable.group<SaleInvoiceForm>({
    customer: this.fb.nonNullable.group<SaleInvoiceCustomerForm>({
      customer: this.fb.nonNullable.control({} as Customer, { validators: [Validators.required] }),
      billingaddress: this.buildAddressGroup(),
      shippingaddress: this.buildAddressGroup(),
      useBillingForShipping: this.fb.control(true, { nonNullable: true }),
    }),
  });

}
