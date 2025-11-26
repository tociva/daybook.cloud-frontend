import { inject, Injectable } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Vendor } from "../../../store/vendor";
import { Item } from "../../../store/item";
import { Tax } from "../../../store/tax";
import { 
  AddressGroup, 
  PurchaseInvoiceVendorForm, 
  PurchaseInvoiceForm, 
  PurchaseInvoicePropertiesForm, 
  PurchaseInvoiceSummaryForm, 
  PurchaseItemForm, 
  PurchaseItemsDetailsForm, 
  PurchaseItemTaxForm 
} from "./purchase-invoice-form.type";

@Injectable({ providedIn: 'root' })
export class PurchaseInvoiceFormService { 
  
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
  
  public readonly buildPurchaseItemTaxForm = ():FormGroup<PurchaseItemTaxForm> => {
    return this.fb.nonNullable.group<PurchaseItemTaxForm>({
      rate: this.fb.control({value: '0 %', disabled: true}, { nonNullable: true }),
      appliedto: this.fb.control({value: 100, disabled: true}, { nonNullable: true }),
      amount: this.fb.control({value: '0', disabled: true}, { nonNullable: true }),
      name: this.fb.control({value: 'No Tax', disabled: true}, { nonNullable: true }),
      shortname: this.fb.control({value: 'No Tax', disabled: true}, { nonNullable: true }),
      tax: this.fb.control<Tax | null>(null),
    });
  }

  private readonly buildPurchaseItemTaxesForm = (taxCount: number): FormArray<FormGroup<PurchaseItemTaxForm>> => {
    const groups = [];
    for(let idx = 0; idx < taxCount; idx++) {
      groups.push(this.buildPurchaseItemTaxForm());
    }
    return this.fb.nonNullable.array<FormGroup<PurchaseItemTaxForm>>(groups);
  };

  public readonly buildPurchaseItemForm = (taxCount: number):FormGroup<PurchaseItemForm> => {
    return this.fb.nonNullable.group<PurchaseItemForm>({
      name: this.fb.control('', { nonNullable: true }),
      description: this.fb.control(null),
      code: this.fb.control('', { nonNullable: true }),
      price: this.fb.control('', { nonNullable: true }),
      quantity: this.fb.control('', { nonNullable: true }),
      itemtotal: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
      discpercent: this.fb.control('', { nonNullable: true }),
      discamount: this.fb.control({value: '', disabled: true}),
      subtotal: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
      taxes: this.buildPurchaseItemTaxesForm(taxCount),
      taxamount: this.fb.control({value: '', disabled: true}),
      grandtotal: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
      item: this.fb.control<Item | null>(null),
    });
  }
  
  private readonly buildPurchaseInvoiceSummaryForm = ():FormGroup<PurchaseInvoiceSummaryForm> => {
    return this.fb.nonNullable.group<PurchaseInvoiceSummaryForm>({
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

  createForm(): FormGroup<PurchaseInvoiceForm> {
    
    return this.fb.group<PurchaseInvoiceForm>({
      vendor: this.fb.nonNullable.group<PurchaseInvoiceVendorForm>({
        vendor: this.fb.control<Vendor | null>(null, {
          validators: [Validators.required],
        }),
        vendoraddress: this.buildAddressGroup(),
      }),
      properties: this.fb.nonNullable.group<PurchaseInvoicePropertiesForm>({
        number: this.fb.control("", { nonNullable: true }),
        date: this.fb.control("", { nonNullable: true }),
        duedate: this.fb.control("", { nonNullable: true }),
        journal: this.fb.control("", { nonNullable: true }),
        taxoption: this.fb.control("Intra State", { nonNullable: true }),
        sourcestate: this.fb.control("", { nonNullable: true }),
        currency: this.fb.control(null, { nonNullable: true }),
      }),
      itemsDetails: this.fb.nonNullable.group<PurchaseItemsDetailsForm>({
        showDiscount: this.fb.nonNullable.control(false),
        showDescription: this.fb.nonNullable.control(false),
        items: this.fb.nonNullable.array<FormGroup<PurchaseItemForm>>(
        [],
        { validators: [Validators.required] },
      ),
      summary: this.buildPurchaseInvoiceSummaryForm(),
      }),
    });
  }
  

}

