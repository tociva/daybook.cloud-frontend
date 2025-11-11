import { inject, Injectable } from "@angular/core";
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import dayjs from "dayjs";
import { DEFAULT_NODE_DATE_FORMAT } from "../../../../../../util/constants";
import { formatAmountToFraction } from "../../../../../../util/currency.util";
import { Currency } from "../../../../../shared/store/currency/currency.model";
import { PurchaseInvoice } from "../../../store/purchase-invoice/purchase-invoice.model";
import { PurchaseReturnItemTax } from "../../../store/purchase-return/purchase-return-item-tax.model";
import { Item } from "../../../store/item/item.model";
import { Tax } from "../../../store/tax";
import { PurchaseReturnPurchaseInvoiceForm, PurchaseReturnForm, PurchaseReturnPropertiesForm, PurchaseReturnSummaryForm, PurchaseReturnTaxDisplayModeType, PurchaseReturnItemForm, PurchaseReturnItemFormValue, PurchaseReturnItemTaxForm } from "./purchase-return-form.type";

@Injectable({ providedIn: 'root' })
export class PurchaseReturnFormService { 
  private fb = inject(FormBuilder);

  private buildPurchaseReturnItemTaxForm(seed?: Partial<PurchaseReturnItemTax>, fractions = 2):FormGroup<PurchaseReturnItemTaxForm> {
    return this.fb.nonNullable.group<PurchaseReturnItemTaxForm>({
      rate: this.fb.control({value: formatAmountToFraction(seed?.rate , fractions), disabled: true}, { nonNullable: true }),
      appliedto: this.fb.control({value: seed?.appliedto ?? 0, disabled: true}, { nonNullable: true }),
      amount: this.fb.control({value: formatAmountToFraction(seed?.amount, fractions), disabled: true}, { nonNullable: true }),
      name: this.fb.control({value: seed?.name ?? '', disabled: true}, { nonNullable: true }),
      shortname: this.fb.control({value: seed?.shortname ?? '', disabled: true}, { nonNullable: true }),
      tax: this.fb.control(seed?.tax ?? {} as Tax, { nonNullable: true }),
    });
  }

  public buildPurchaseReturnItemTaxesForm(taxes?: Partial<PurchaseReturnItemTax>[]):FormArray<FormGroup<PurchaseReturnItemTaxForm>> {
    const tagGroupArray = taxes?.map(tax => this.buildPurchaseReturnItemTaxForm(tax)) ?? [];
    return this.fb.nonNullable.array<FormGroup<PurchaseReturnItemTaxForm>>(tagGroupArray, { validators: [Validators.required] });
  }

  public readonly buildPurchaseReturnItemForm = (seed?: PurchaseReturnItemFormValue, fractions = 2):FormGroup<PurchaseReturnItemForm> => {
    return this.fb.nonNullable.group<PurchaseReturnItemForm>({
      name: this.fb.control(seed?.name ?? '', { nonNullable: true }),
      description: this.fb.control(seed?.description ?? null),
      code: this.fb.control(seed?.code ?? '', { nonNullable: true }),
      price: this.fb.control(formatAmountToFraction(seed?.price, fractions), { nonNullable: true }),
      quantity: this.fb.control(formatAmountToFraction(seed?.quantity, fractions), { nonNullable: true }),
      itemtotal: this.fb.control({value: formatAmountToFraction(seed?.itemtotal, fractions), disabled: true}, { nonNullable: true }),
      taxes: this.buildPurchaseReturnItemTaxesForm(seed?.taxes),
      taxamount: this.fb.control({value: formatAmountToFraction(seed?.taxamount, fractions), disabled: true}),
      grandtotal: this.fb.control({value: formatAmountToFraction(seed?.grandtotal, fractions), disabled: true}, { nonNullable: true }),
      item: this.fb.control(seed?.item ?? {} as Item, { nonNullable: true }),
    });
  }

  public readonly createPurchaseReturnForm = () => 
    {
      const today = dayjs();
      const invDate = today.format(DEFAULT_NODE_DATE_FORMAT);
      const duedate = today.add(7, 'days').format(DEFAULT_NODE_DATE_FORMAT);
      return this.fb.nonNullable.group<PurchaseReturnForm>({
        taxDisplayMode: this.fb.nonNullable.control(PurchaseReturnTaxDisplayModeType.CGST_SGST,{ validators: [Validators.required] }),
        showDescription: this.fb.nonNullable.control(false),
        purchaseinvoice: this.fb.nonNullable.group<PurchaseReturnPurchaseInvoiceForm>({
          purchaseinvoice: this.fb.nonNullable.control({} as PurchaseInvoice, { validators: [Validators.required] }),
        }),
        properties: this.fb.nonNullable.group<PurchaseReturnPropertiesForm>({
          number: this.fb.control('', { nonNullable: true }),
          date: this.fb.control(invDate, { nonNullable: true }),
          duedate: this.fb.control(duedate, { nonNullable: true }),
          journal: this.fb.control('', { nonNullable: true }),
          currency: this.fb.control({} as Currency, { nonNullable: true }),
          taxoption: this.fb.control('Intra State', { nonNullable: true }),
        }),
        items: this.fb.nonNullable.array<FormGroup<PurchaseReturnItemForm>>([this.buildPurchaseReturnItemForm()], { validators: [Validators.required] }),
        summary: this.fb.nonNullable.group<PurchaseReturnSummaryForm>({
          itemtotal: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
          tax: this.fb.control({value: '', disabled: true}),
          roundoff: this.fb.control({value: '', disabled: false}),
          grandtotal: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
          words: this.fb.control({value: '', disabled: true}, { nonNullable: true }),
        }),
  })
};

}

