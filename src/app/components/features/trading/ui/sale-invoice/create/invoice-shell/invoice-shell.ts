import { Component, computed, effect, inject } from '@angular/core';
import { InvoiceCustomer } from '../invoice-customer/invoice-customer';
import { InvoiceItems } from '../invoice-items/invoice-items';
import { InvoiceProperties } from '../invoice-properties/invoice-properties';
import { InvoiceSummary } from '../invoice-summary/invoice-summary';
import { SaleInvoiceFormService } from '../../util/sale-invoice-form.service';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SaleInvoiceCustomerForm, SaleInvoicePropertiesForm } from '../../util/sale-invoice-form.type';

@Component({
  selector: 'app-invoice-shell',
  imports: [ReactiveFormsModule, InvoiceCustomer, InvoiceProperties, InvoiceItems, InvoiceSummary],
  templateUrl: './invoice-shell.html',
  styleUrl: './invoice-shell.css'
})
export class InvoiceShell {

  private readonly saleInvoiceFormService = inject(SaleInvoiceFormService);
  
  readonly form = this.saleInvoiceFormService.createSaleInvoiceForm();

  readonly customerGroup = computed(() => this.form.get('customer') as FormGroup<SaleInvoiceCustomerForm>);

  readonly propertiesGroup = computed(() => this.form.get('properties') as FormGroup<SaleInvoicePropertiesForm>);

  // 👇 Signal that reflects the current value of 'customer'
readonly customerValue = toSignal(
  this.customerGroup().valueChanges.pipe(startWith(this.customerGroup().getRawValue())),
  { initialValue: this.customerGroup().getRawValue() }
);

// 👇 Effect runs whenever 'customer' changes
private customerEffect = effect(() => {
  const value = this.customerValue();
  const {customer} = value;
  if(customer?.currency) {
    this.propertiesGroup().patchValue({ currency: customer.currency });
  }
  if(customer?.state) {
    this.propertiesGroup().patchValue({ deliverystate: customer.state });
  }
});

  onSubmit() {
    console.log(this.form.value);
  }
}
