import { inject, Injectable } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Address } from "../../../../../../util/types/address";
import { TaxOptions } from "../../../../../../util/types/tax-options.type";
import { Currency } from "../../../../../shared/store/currency/currency.model";
import { SaleInvoice } from "../../../store/sale-invoice/sale-invoice.model";
import { AddressGroup, SaleInvoiceForm, SaleItemForm } from "./sale-invoice-form.type";
import { SaleItem } from "../../../store/sale-invoice/sale-item.model";


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

private buildSaleItemGroup(item: Partial<SaleItem> = {}): FormGroup<SaleItemForm> {
  return this.fb.group<SaleItemForm>({
    name: this.fb.control(item.name ?? '', { nonNullable: true, validators: [Validators.required] }),
    description: this.fb.control(item.description ?? null),
    order: this.fb.control(item.order ?? 0, { nonNullable: true }),
    code: this.fb.control(item.code ?? '', { nonNullable: true }),
    price: this.fb.control(item.price ?? 0, { nonNullable: true, validators: [Validators.min(0)] }),
    quantity: this.fb.control(item.quantity ?? 1, { nonNullable: true, validators: [Validators.min(1)] }),
    itemtotal: this.fb.control(item.itemtotal ?? 0, { nonNullable: true, validators: [Validators.min(0)] }),
    discpercent: this.fb.control(item.discpercent ?? null, { validators: [Validators.min(0), Validators.max(100)] }),
    discamount: this.fb.control(item.discamount ?? null, { validators: [Validators.min(0)] }),
    subtotal: this.fb.control(item.subtotal ?? 0, { nonNullable: true, validators: [Validators.min(0)] }),
    taxamount: this.fb.control(item.taxamount ?? null, { validators: [Validators.min(0)] }),
    grandtotal: this.fb.control(item.grandtotal ?? 0, { nonNullable: true, validators: [Validators.min(0)] }),
    saleinvoiceid: this.fb.control(item.saleinvoiceid ?? null),
    item: this.fb.control(item.item as any, { nonNullable: true, validators: [Validators.required] }),
    itemid: this.fb.control(item.itemid ?? '', { nonNullable: true, validators: [Validators.required] }),
  });
}

private createItemsArray(items: Partial<SaleItem>[] = []): FormArray<FormGroup<SaleItemForm>> {
  return this.fb.array(items.map(i => this.buildSaleItemGroup(i)));
}

  createForm(
    init: Partial<SaleInvoice> = {}
  ): FormGroup<SaleInvoiceForm> {
    return this.fb.group<SaleInvoiceForm>({
      customer: this.fb.control(init.customer ?? null, { nonNullable: true, validators: [Validators.required] }),
      billingaddress: this.buildAddressGroup(this.fb),
      billingaddressreadonly: this.fb.control(true, { nonNullable: true }),
      shippingaddress: this.buildAddressGroup(this.fb),
      shippingaddressreadonly: this.fb.control(true, { nonNullable: true }),
      useBillingForShipping: this.fb.control(true, { nonNullable: true }),
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
      items: this.createItemsArray(init.items as Partial<SaleItem>[] | undefined),
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