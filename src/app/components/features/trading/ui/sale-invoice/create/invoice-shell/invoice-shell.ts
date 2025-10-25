import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { startWith, tap } from 'rxjs';
import { TWO } from '../../../../../../../util/constants';
import { formatAmountToFraction, formatAmountToWords } from '../../../../../../../util/currency.util';
import { CancelButton } from '../../../../../../shared/cancel-button/cancel-button';
import { SaleInvoiceRequest } from '../../../../store/sale-invoice/sale-invoice-request.type';
import { saleInvoiceActions } from '../../../../store/sale-invoice/sale-invoice.actions';
import { SaleInvoiceFormService } from '../../util/sale-invoice-form.service';
import { SaleInvoiceCustomerForm, SaleInvoiceFormValue, SaleInvoicePropertiesForm, SaleInvoiceSummaryForm, SaleItemForm } from '../../util/sale-invoice-form.type';
import { mapSaleInvoiceFormValueToRequest } from '../../util/sale-invoice.util';
import { InvoiceCustomer } from '../invoice-customer/invoice-customer';
import { InvoiceItems } from '../invoice-items/invoice-items';
import { InvoiceProperties } from '../invoice-properties/invoice-properties';
import { InvoiceSummary } from '../invoice-summary/invoice-summary';

@Component({
  selector: 'app-invoice-shell',
  imports: [ReactiveFormsModule, InvoiceCustomer, InvoiceProperties, InvoiceItems, InvoiceSummary, CancelButton, NgClass],
  templateUrl: './invoice-shell.html',
  styleUrl: './invoice-shell.css'
})
export class InvoiceShell {

  private readonly saleInvoiceFormService = inject(SaleInvoiceFormService);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly store = inject(Store);

  private readonly actions$ = inject(Actions);

  readonly form = this.saleInvoiceFormService.createSaleInvoiceForm();

  readonly customerGroup = computed(() => this.form.get('customer') as FormGroup<SaleInvoiceCustomerForm>);

  readonly propertiesGroup = computed(() => this.form.get('properties') as FormGroup<SaleInvoicePropertiesForm>);

  readonly itemsGroup = computed(() => this.form.get('items') as FormArray<FormGroup<SaleItemForm>>);

  readonly summaryGroup = computed(() => this.form.get('summary') as FormGroup<SaleInvoiceSummaryForm>);

  readonly fractions = signal<number>(2);

  readonly submitting = signal(false);

  // 👇 Signal that reflects the current value of 'customer'
  readonly customerSignal = toSignal(
    (this.customerGroup().get('customer') as FormControl).valueChanges.pipe(
      startWith(this.customerGroup().get('customer')?.value)
    ),
    { initialValue: this.customerGroup().get('customer')?.value }
  );

  private customerEffect = effect(() => {
    const customer = this.customerSignal();
    if (customer?.currency) {
      this.propertiesGroup().patchValue({ currency: customer.currency });
      this.fractions.set(customer.currency.fractions ?? TWO);
    }
    if (customer?.state) {
      this.propertiesGroup().patchValue({ deliverystate: customer.state });
    }
  });

  readonly taxModeSignal = toSignal(
    (this.propertiesGroup().get('taxoption') as FormControl).valueChanges.pipe(
      startWith(this.propertiesGroup().get('taxoption')?.value)
    ),
    { initialValue: this.propertiesGroup().get('taxoption')?.value }
  );
  readonly taxMode = computed(() => this.taxModeSignal());

  readonly currencySignal = toSignal(
    (this.propertiesGroup().get('currency') as FormControl).valueChanges.pipe(
      startWith(this.propertiesGroup().get('currency')?.value)
    ),
    { initialValue: this.propertiesGroup().get('currency')?.value }
  );
  readonly currency = computed(() => this.currencySignal());
  private currencyEffect = effect(() => {
    const currency = this.currencySignal();
    if (currency) {
      this.fractions.set(currency.minorunit ?? TWO);
    }
  });

  private readonly createActionSuccessEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(saleInvoiceActions.createSaleInvoiceSuccess),
      tap(() => {
        this.submitting.set(false);
        const burl = this.route.snapshot.queryParamMap.get('burl') ?? '/';
        this.router.navigateByUrl(burl);
      })
    ).subscribe();
    onCleanup(() => subscription.unsubscribe());
  });

  private readonly createActionFailureEffect = effect((onCleanup) => {
    const subscription = this.actions$.pipe(
      ofType(saleInvoiceActions.createSaleInvoiceFailure),
      tap(() => {
        this.submitting.set(false);
      })
    ).subscribe();
    onCleanup(() => subscription.unsubscribe());
  });

  private reCalculateSummary = () => {
    let itemtotal = 0;
    let discount = 0;
    let subtotal = 0;
    let tax = 0;
    let grandtotal = 0;
    this.form.controls.items.controls.forEach(item => {
      itemtotal += Number(item.get('itemtotal')?.value ?? 0);
      discount += Number(item.get('discamount')?.value ?? 0);
      subtotal += Number(item.get('subtotal')?.value ?? 0);
      tax += Number(item.get('taxamount')?.value ?? 0);
      grandtotal += Number(item.get('grandtotal')?.value ?? 0); 
    });
    const roundoff = Number(this.form.get('summary')?.get('roundoff')?.value ?? 0);
    grandtotal += roundoff;
    this.summaryGroup().patchValue({ 
      itemtotal: formatAmountToFraction(itemtotal, this.fractions()), 
      discount: formatAmountToFraction(discount, this.fractions()), 
      subtotal: formatAmountToFraction(subtotal, this.fractions()), 
      tax: formatAmountToFraction(tax, this.fractions()), roundoff: 
      formatAmountToFraction(roundoff, this.fractions()), 
      grandtotal: formatAmountToFraction(grandtotal, this.fractions()),
      words: formatAmountToWords(grandtotal, this.currency()) });
  }

  onDestroy() {
    this.customerEffect.destroy();
    this.currencyEffect.destroy();
    this.createActionSuccessEffect.destroy();
    this.createActionFailureEffect.destroy();
  }

  onItemUpdate = () => this.reCalculateSummary();

  onRoundoffChange = () => this.reCalculateSummary();
  
  onSubmit() {
    this.submitting.set(true);
    const formValue = this.form.getRawValue() as unknown as SaleInvoiceFormValue;
    const saleInvoiceRequest: SaleInvoiceRequest =  mapSaleInvoiceFormValueToRequest(formValue);
    this.store.dispatch(saleInvoiceActions.createSaleInvoice({ saleInvoice: saleInvoiceRequest }));
  }
}
