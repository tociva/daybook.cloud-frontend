import { inject, Injectable } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Customer } from "../../../store/customer";
import { Item } from "../../../store/item";
import { Tax } from "../../../store/tax";
import { AddressGroup, SaleInvoiceCustomerForm, SaleInvoiceForm, SaleInvoicePropertiesForm, SaleInvoiceSummaryForm, SaleItemForm, SaleItemsDetailsForm, SaleItemTaxForm } from "./sale-invoice-form.type";

@Injectable({ providedIn: 'root' })
export class SaleInvoiceFormService { 
  
  private readonly fb = inject(FormBuilder);

  private readonly buildAddressGroup = ():FormGroup<AddressGroup> => {
    return this.fb.group<AddressGroup>({
      name: this.fb.control('', { nonNullable: true }),
      line1: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      line2: this.fb.control(null),
      street: this.fb.control('', { nonNullable: true }),
      city: this.fb.control('', { nonNullable: true }),
      state: this.fb.control('', { nonNullable: true }),
      zip: this.fb.control('', { nonNullable: true }),
      country: this.fb.control('', { nonNullable: true }),
      mobile: this.fb.control(null),
      email: this.fb.control(null, { validators: [] }),
    });
  }
  
  public readonly buildSaleItemTaxForm = ():FormGroup<SaleItemTaxForm> => {
    return this.fb.nonNullable.group<SaleItemTaxForm>({
      rate: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
      appliedto: this.fb.control({value: 0, disabled: true}, { nonNullable: true }),
      amount: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
      name: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
      shortname: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
      tax: this.fb.control<Tax | null>(null),
    });
  }

  private readonly buildSaleItemTaxesForm = (taxCount: number): FormArray<FormGroup<SaleItemTaxForm>> => {
    const groups = [];
    for(let idx = 0; idx < taxCount; idx++) {
      groups.push(this.buildSaleItemTaxForm());
    }
    return this.fb.nonNullable.array<FormGroup<SaleItemTaxForm>>(groups);
  };

  public readonly buildSaleItemForm = (taxCount: number):FormGroup<SaleItemForm> => {
    return this.fb.nonNullable.group<SaleItemForm>({
      name: this.fb.control('', { nonNullable: true }),
      description: this.fb.control(null),
      code: this.fb.control('', { nonNullable: true }),
      price: this.fb.control('', { nonNullable: true }),
      quantity: this.fb.control('', { nonNullable: true }),
      itemtotal: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
      discpercent: this.fb.control('', { nonNullable: true }),
      discamount: this.fb.control({value: '', disabled: true}),
      subtotal: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
      taxes: this.buildSaleItemTaxesForm(taxCount),
      taxamount: this.fb.control({value: '', disabled: true}),
      grandtotal: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
      item: this.fb.control<Item | null>(null),
    });
  }
  
  private readonly buildSaleInvoiceSummaryForm = ():FormGroup<SaleInvoiceSummaryForm> => {
    return this.fb.nonNullable.group<SaleInvoiceSummaryForm>({
      itemtotal: this.fb.control(
        { value: "", disabled: true },
        { nonNullable: true },
      ),
      discount: this.fb.control(
        { value: "", disabled: true },
      ),
      subtotal: this.fb.control(
        { value: "", disabled: true },
        { nonNullable: true },
      ),
      tax: this.fb.control(
        { value: "", disabled: true },
      ),
      roundoff: this.fb.control(
        { value: "", disabled: false },
      ),
      grandtotal: this.fb.control(
        { value: "", disabled: true },
        { nonNullable: true },
      ),
      words: this.fb.control(
        { value: "", disabled: true },
        { nonNullable: true },
      ),
    });
  };

  createForm(): FormGroup<SaleInvoiceForm> {
    
    return this.fb.group<SaleInvoiceForm>({
      customer: this.fb.nonNullable.group<SaleInvoiceCustomerForm>({
        customer: this.fb.control<Customer | null>(null, {
          validators: [Validators.required],
        }),
        billingaddress: this.buildAddressGroup(),
        shippingaddress: this.buildAddressGroup(),
        useBillingForShipping: this.fb.control(
          true,
          { nonNullable: true },
        ),
      }),
      properties: this.fb.nonNullable.group<SaleInvoicePropertiesForm>({
        number: this.fb.control("", { nonNullable: true }),
        date: this.fb.control("", { nonNullable: true }),
        duedate: this.fb.control("", { nonNullable: true }),
        journal: this.fb.control("", { nonNullable: true }),
        taxoption: this.fb.control("Intra State", { nonNullable: true }),
        deliverystate: this.fb.control("", { nonNullable: true }),
        autoNumbering: this.fb.control(false, { nonNullable: true }),
        currency: this.fb.control(null, { nonNullable: true }),
      }),
      itemsDetails: this.fb.nonNullable.group<SaleItemsDetailsForm>({
        taxoption: this.fb.nonNullable.control("Intra State"),
        showDiscount: this.fb.nonNullable.control(false),
        showDescription: this.fb.nonNullable.control(false),
        items: this.fb.nonNullable.array<FormGroup<SaleItemForm>>(
        [],
        { validators: [Validators.required] },
      ),
      summary: this.buildSaleInvoiceSummaryForm(),
      }),
    });
  }
  

}
