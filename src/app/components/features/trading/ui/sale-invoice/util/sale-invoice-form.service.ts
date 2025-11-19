import { inject, Injectable } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import dayjs from "dayjs";
import { DEFAULT_NODE_DATE_FORMAT } from "../../../../../../util/constants";
import { formatAmountToFraction } from "../../../../../../util/currency.util";
import { Address } from "../../../../../../util/types/address";
import { Customer } from "../../../store/customer/customer.model";
import { Item } from "../../../store/item/item.model";
import { SaleItemTax } from "../../../store/sale-invoice/sale-item-tax.model";
import { Tax } from "../../../store/tax";
import { AddressGroup, SaleInvoiceCustomerForm, SaleInvoiceForm, SaleInvoiceFormValue, SaleInvoicePropertiesForm, SaleInvoiceSummaryForm, SaleInvoiceTaxDisplayModeType, SaleItemForm, SaleItemFormValue, SaleItemTaxForm } from "./sale-invoice-form.type";

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

private buildSaleItemTaxForm(seed?: Partial<SaleItemTax>, fractions = 2):FormGroup<SaleItemTaxForm> {
  return this.fb.nonNullable.group<SaleItemTaxForm>({
    rate: this.fb.control({value: formatAmountToFraction(seed?.rate , fractions), disabled: true}, { nonNullable: true }),
    appliedto: this.fb.control({value: seed?.appliedto ?? 0, disabled: true}, { nonNullable: true }),
    amount: this.fb.control({value: formatAmountToFraction(seed?.amount, fractions), disabled: true}, { nonNullable: true }),
    name: this.fb.control({value: seed?.name ?? '', disabled: true}, { nonNullable: true }),
    shortname: this.fb.control({value: seed?.shortname ?? '', disabled: true}, { nonNullable: true }),
    tax: this.fb.control(seed?.tax ?? {} as Tax, { nonNullable: true }),
  });
}

public buildSaleItemTaxesForm(taxes?: Partial<SaleItemTax>[]):FormArray<FormGroup<SaleItemTaxForm>> {
  const tagGroupArray: FormGroup<SaleItemTaxForm>[] = [];
  taxes?.forEach((tax) => {
    if(tax?.name) {
      tagGroupArray.push(this.buildSaleItemTaxForm(tax));
    }
  });
  return this.fb.nonNullable.array<FormGroup<SaleItemTaxForm>>(tagGroupArray, { validators: [Validators.required] });
}

public readonly buildSaleItemForm = (seed?: SaleItemFormValue, fractions = 2):FormGroup<SaleItemForm> => {
  return this.fb.nonNullable.group<SaleItemForm>({
    name: this.fb.control(seed?.name ?? '', { nonNullable: true }),
    description: this.fb.control(seed?.description ?? null),
    code: this.fb.control(seed?.code ?? '', { nonNullable: true }),
    price: this.fb.control(formatAmountToFraction(seed?.price, fractions), { nonNullable: true }),
    quantity: this.fb.control(formatAmountToFraction(seed?.quantity, fractions), { nonNullable: true }),
    itemtotal: this.fb.control({value: formatAmountToFraction(seed?.itemtotal, fractions), disabled: true}, { nonNullable: true }),
    discpercent: this.fb.control(formatAmountToFraction(seed?.discpercent, fractions), { nonNullable: true }),
    discamount: this.fb.control({value: formatAmountToFraction(seed?.discamount, fractions), disabled: true}),
    subtotal: this.fb.control({value: formatAmountToFraction(seed?.subtotal, fractions), disabled: true}, { nonNullable: true }),
    taxes: this.buildSaleItemTaxesForm(seed?.taxes),
    taxamount: this.fb.control({value: formatAmountToFraction(seed?.taxamount, fractions), disabled: true}),
    grandtotal: this.fb.control({value: formatAmountToFraction(seed?.grandtotal, fractions), disabled: true}, { nonNullable: true }),
    item: this.fb.control(seed?.item ?? {} as Item, { nonNullable: true }),
  });
}

  public readonly createSaleInvoiceForm = (
    seed?: SaleInvoiceFormValue,
    fractions = 2,
  ) => {
    const today = dayjs();
    const invDate = seed?.properties?.date ?? today.format(DEFAULT_NODE_DATE_FORMAT);
    const duedate = seed?.properties?.duedate ?? today.add(7, "days").format(DEFAULT_NODE_DATE_FORMAT);

    return this.fb.nonNullable.group<SaleInvoiceForm>({
      taxDisplayMode: this.fb.nonNullable.control(
        seed?.taxDisplayMode ?? SaleInvoiceTaxDisplayModeType.CGST_SGST,
        { validators: [Validators.required] },
      ),

      showDiscount: this.fb.nonNullable.control(seed?.showDiscount ?? false),
      showDescription: this.fb.nonNullable.control(seed?.showDescription ?? false),

      customer: this.fb.nonNullable.group<SaleInvoiceCustomerForm>({
        customer: this.fb.nonNullable.control(
          seed?.customer?.customer ?? ({} as Customer),
          { validators: [Validators.required] },
        ),
        billingaddress: this.buildAddressGroup(seed?.customer?.billingaddress),
        shippingaddress: this.buildAddressGroup(seed?.customer?.shippingaddress),
        // NOTE: property name differs in value type vs form (see section 3)
        useBillingForShipping: this.fb.control(
          seed?.customer?.usebillingforshipping ?? true,
          { nonNullable: true },
        ),
      }),

      properties: this.fb.nonNullable.group<SaleInvoicePropertiesForm>({
        number: this.fb.control(seed?.properties?.number ?? "", { nonNullable: true }),
        date: this.fb.control(invDate, { nonNullable: true }),
        duedate: this.fb.control(duedate, { nonNullable: true }),
        journal: this.fb.control(seed?.properties?.journal ?? "", { nonNullable: true }),
        taxoption: this.fb.control(seed?.properties?.taxoption ?? "Intra State", { nonNullable: true }),
        deliverystate: this.fb.control(seed?.properties?.deliverystate ?? "", { nonNullable: true }),
        autoNumbering: this.fb.control(seed?.properties?.autoNumbering ?? false, { nonNullable: true }),
        // currency is in SaleInvoicePropertiesFormValue but NOT in the form – that’s OK,
        // just means you manage it separately.
      }),

      items: this.fb.nonNullable.array<FormGroup<SaleItemForm>>(
        seed?.items?.length
          ? seed.items.map(itemSeed => this.buildSaleItemForm(itemSeed, fractions))
          : [this.buildSaleItemForm(undefined, fractions)],
        { validators: [Validators.required] },
      ),

      summary: this.fb.nonNullable.group<SaleInvoiceSummaryForm>({
        itemtotal: this.fb.control(
          { value: seed?.summary?.itemtotal ?? "", disabled: true },
          { nonNullable: true },
        ),
        discount: this.fb.control(
          { value: seed?.summary?.discount ?? "", disabled: true },
        ),
        subtotal: this.fb.control(
          { value: seed?.summary?.subtotal ?? "", disabled: true },
          { nonNullable: true },
        ),
        tax: this.fb.control(
          { value: seed?.summary?.tax ?? "", disabled: true },
        ),
        roundoff: this.fb.control(
          { value: seed?.summary?.roundoff ?? "", disabled: false },
        ),
        grandtotal: this.fb.control(
          { value: seed?.summary?.grandtotal ?? "", disabled: true },
          { nonNullable: true },
        ),
        words: this.fb.control(
          { value: seed?.summary?.words ?? "", disabled: true },
          { nonNullable: true },
        ),
      }),
    });
  };


}
