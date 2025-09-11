import { inject, Injectable } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Address } from "../../../../../../util/types/address";
import { TaxOptions } from "../../../../../../util/types/tax-options.type";
import { Currency } from "../../../../../shared/store/currency/currency.model";
import { SaleInvoice } from "../../../store/sale-invoice/sale-invoice.model";
import { AddressGroup, SaleInvoiceForm } from "./sale-invoice-form.type";


@Injectable({ providedIn: 'root' })
export class SaleInvoiceFormService {
  private fb = inject(FormBuilder);


 buildAddressGroup(fb: FormBuilder, seed?: Partial<Address>) {
  return fb.group<AddressGroup>({
    name: fb.control(seed?.name ?? '', { nonNullable: true }),
    line1: fb.control(seed?.line1 ?? '', { nonNullable: true, validators: [Validators.required] }),
    line2: fb.control(seed?.line2 ?? null),
    street: fb.control(seed?.street ?? '', { nonNullable: true }),
    city: fb.control(seed?.city ?? '', { nonNullable: true }),
    state: fb.control(seed?.state ?? '', { nonNullable: true }),
    zip: fb.control(seed?.zip ?? '', { nonNullable: true }),
    country: fb.control(seed?.country ?? '', { nonNullable: true }),
    mobile: fb.control(seed?.mobile ?? null),
    email: fb.control(seed?.email ?? null, { validators: [] }),
  });
}


  createForm(
    init: Partial<SaleInvoice> = {}
  ): FormGroup<SaleInvoiceForm> {
    return this.fb.group<SaleInvoiceForm>({
      customer: this.fb.control(init.customer ?? null, { nonNullable: true, validators: [Validators.required] }),
      billingaddress: this.buildAddressGroup(this.fb),
      shippingaddress: this.buildAddressGroup(this.fb),
      useBillingForShipping: this.fb.control(false, { nonNullable: true }),
      number: this.fb.control(init.number ?? '', { nonNullable: true, validators: [Validators.required] }),
      date: this.fb.control(init.date ?? '', { nonNullable: true, validators: [Validators.required] }),
      duedate: this.fb.control(init.duedate ?? '', { nonNullable: true, validators: [Validators.required] }),
      itemtotal: this.fb.control(init.itemtotal ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      discount: this.fb.control<number | null>(init.discount ?? null, { validators: [Validators.min(0)] }),
      subtotal: this.fb.control(init.subtotal ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      tax: this.fb.control<number | null>(init.tax ?? null, { validators: [Validators.min(0)] }),
      roundoff: this.fb.control<number | null>(init.roundoff ?? null),
      grandtotal: this.fb.control(init.grandtotal ?? 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      currency: this.fb.control(init.currency ?? null, { nonNullable: true, validators: [Validators.required] }),
      description: this.fb.control<string | null>(init.description ?? null),
      autoNumbering: this.fb.control(Boolean(init.number), { nonNullable: true }),
      deliveryState: this.fb.control(String(init.sprops?.['deliveryState'] ?? ''), { nonNullable: true }),
      taxOption: this.fb.control(TaxOptions.CGST_SGST, { nonNullable: true }),
      showDescription: this.fb.control(Boolean(init.description), { nonNullable: true }),
      showDiscount: this.fb.control(Boolean(init.discount), { nonNullable: true }),
      journal: this.fb.control(String(init.sprops?.['journal'] ?? ''), { nonNullable: true }),
    });
  }

  patchForm(
    form: FormGroup<SaleInvoiceForm>,
    dto: Partial<SaleInvoice>
  ): void {
    form.patchValue({
      customer: dto.customer ?? form.controls.customer.value,
      billingaddress: dto.billingaddress ?? form.controls.billingaddress.value,
      shippingaddress: dto.shippingaddress ?? form.controls.shippingaddress.value,
      number: dto.number ?? form.controls.number.value,
      date: dto.date ?? form.controls.date.value,
      duedate: dto.duedate ?? form.controls.duedate.value,
      itemtotal: dto.itemtotal ?? form.controls.itemtotal.value,
      discount: dto.discount ?? form.controls.discount.value,
      subtotal: dto.subtotal ?? form.controls.subtotal.value,
      tax: dto.tax ?? form.controls.tax.value,
      roundoff: dto.roundoff ?? form.controls.roundoff.value,
      grandtotal: dto.grandtotal ?? form.controls.grandtotal.value,
      currency: dto.currency ?? form.controls.currency.value,
      description: dto.description ?? form.controls.description.value,
    });
  }
  toSaleInvoice(form: FormGroup<SaleInvoiceForm>): Partial<SaleInvoice> {
    const v = form.getRawValue();
    return {
      number: v.number,
      date: v.date,
      duedate: v.duedate,
      itemtotal: v.itemtotal,
      ...(v.discount != null ? { discount: v.discount } : {}),
      subtotal: v.subtotal,
      ...(v.tax != null ? { tax: v.tax } : {}),
      ...(v.roundoff != null ? { roundoff: v.roundoff } : {}),
      grandtotal: v.grandtotal,
      currency: v.currency as Currency,
      ...(v.description ? { description: v.description } : {}),
      customer: v.customer ?? undefined,
    };
  }
}