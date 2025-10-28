import { inject, Injectable } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import dayjs from "dayjs";
import { DEFAULT_NODE_DATE_FORMAT } from "../../../../../../util/constants";
import { formatAmountToFraction } from "../../../../../../util/currency.util";
import { Address } from "../../../../../../util/types/address";
import { Currency } from "../../../../../shared/store/currency/currency.model";
import { Vendor } from "../../../store/vendor/vendor.model";
import { Item } from "../../../store/item/item.model";
import { PurchaseItemTax } from "../../../store/purchase-invoice/purchase-item-tax.model";
import { Tax } from "../../../store/tax";
import { AddressGroup, PurchaseInvoiceVendorForm, PurchaseInvoiceForm, PurchaseInvoicePropertiesForm, PurchaseInvoiceSummaryForm, PurchaseInvoiceTaxDisplayModeType, PurchaseItemForm, PurchaseItemFormValue, PurchaseItemTaxForm } from "./purchase-invoice-form.type";

@Injectable({ providedIn: 'root' })
export class PurchaseInvoiceFormService { 
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

  private buildPurchaseItemTaxForm(seed?: Partial<PurchaseItemTax>, fractions = 2):FormGroup<PurchaseItemTaxForm> {
    return this.fb.nonNullable.group<PurchaseItemTaxForm>({
      rate: this.fb.control({value: formatAmountToFraction(seed?.rate , fractions), disabled: true}, { nonNullable: true }),
      appliedto: this.fb.control({value: seed?.appliedto ?? 0, disabled: true}, { nonNullable: true }),
      amount: this.fb.control({value: formatAmountToFraction(seed?.amount, fractions), disabled: true}, { nonNullable: true }),
      name: this.fb.control({value: seed?.name ?? '', disabled: true}, { nonNullable: true }),
      shortname: this.fb.control({value: seed?.shortname ?? '', disabled: true}, { nonNullable: true }),
      tax: this.fb.control(seed?.tax ?? {} as Tax, { nonNullable: true }),
    });
  }

  public buildPurchaseItemTaxesForm(taxes?: Partial<PurchaseItemTax>[]):FormArray<FormGroup<PurchaseItemTaxForm>> {
    const tagGroupArray = taxes?.map(tax => this.buildPurchaseItemTaxForm(tax)) ?? [];
    return this.fb.nonNullable.array<FormGroup<PurchaseItemTaxForm>>(tagGroupArray, { validators: [Validators.required] });
  }

  public readonly buildPurchaseItemForm = (seed?: PurchaseItemFormValue, fractions = 2):FormGroup<PurchaseItemForm> => {
    return this.fb.nonNullable.group<PurchaseItemForm>({
      name: this.fb.control(seed?.name ?? '', { nonNullable: true }),
      description: this.fb.control(seed?.description ?? null),
      code: this.fb.control(seed?.code ?? '', { nonNullable: true }),
      price: this.fb.control(formatAmountToFraction(seed?.price, fractions), { nonNullable: true }),
      quantity: this.fb.control(formatAmountToFraction(seed?.quantity, fractions), { nonNullable: true }),
      itemtotal: this.fb.control({value: formatAmountToFraction(seed?.itemtotal, fractions), disabled: true}, { nonNullable: true }),
      discpercent: this.fb.control(formatAmountToFraction(seed?.discpercent, fractions), { nonNullable: true }),
      discamount: this.fb.control({value: formatAmountToFraction(seed?.discamount, fractions), disabled: true}),
      subtotal: this.fb.control({value: formatAmountToFraction(seed?.subtotal, fractions), disabled: true}, { nonNullable: true }),
      taxes: this.buildPurchaseItemTaxesForm(seed?.taxes),
      taxamount: this.fb.control({value: formatAmountToFraction(seed?.taxamount, fractions), disabled: true}),
      grandtotal: this.fb.control({value: formatAmountToFraction(seed?.grandtotal, fractions), disabled: true}, { nonNullable: true }),
      item: this.fb.control(seed?.item ?? {} as Item, { nonNullable: true }),
    });
  }

  public readonly createPurchaseInvoiceForm = () => 
    {
      const today = dayjs();
      const invDate = today.format(DEFAULT_NODE_DATE_FORMAT);
      const duedate = today.add(7, 'days').format(DEFAULT_NODE_DATE_FORMAT);
      return this.fb.nonNullable.group<PurchaseInvoiceForm>({
        taxDisplayMode: this.fb.nonNullable.control(PurchaseInvoiceTaxDisplayModeType.CGST_SGST,{ validators: [Validators.required] }),
        showDiscount: this.fb.nonNullable.control(false),
        showDescription: this.fb.nonNullable.control(false),
        vendor: this.fb.nonNullable.group<PurchaseInvoiceVendorForm>({
          vendor: this.fb.nonNullable.control({} as Vendor, { validators: [Validators.required] }),
          billingaddress: this.buildAddressGroup(),
          shippingaddress: this.buildAddressGroup(),
          useBillingForShipping: this.fb.control(true, { nonNullable: true }),
        }),
        properties: this.fb.nonNullable.group<PurchaseInvoicePropertiesForm>({
          number: this.fb.control('', { nonNullable: true }),
          date: this.fb.control(invDate, { nonNullable: true }),
          duedate: this.fb.control(duedate, { nonNullable: true }),
          journal: this.fb.control('', { nonNullable: true }),
          currency: this.fb.control({} as Currency, { nonNullable: true }),
          deliverystate: this.fb.control('', { nonNullable: true }),
          autoNumbering: this.fb.control(true, { nonNullable: true }),
          taxoption: this.fb.control('Intra State', { nonNullable: true }),
        }),
        items: this.fb.nonNullable.array<FormGroup<PurchaseItemForm>>([this.buildPurchaseItemForm()], { validators: [Validators.required] }),
        summary: this.fb.nonNullable.group<PurchaseInvoiceSummaryForm>({
          itemtotal: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
          discount: this.fb.control({value: '', disabled: true}),
          subtotal: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
          tax: this.fb.control({value: '', disabled: true}),
          roundoff: this.fb.control({value: '', disabled: false}),
          grandtotal: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
          words: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
        }),
  })
};

}

