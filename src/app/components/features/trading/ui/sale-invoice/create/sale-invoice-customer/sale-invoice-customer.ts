import { Component, effect, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Store } from '@ngrx/store';
import { AutoComplete } from '../../../../../../shared/auto-complete/auto-complete';
import { DbcAddressForm } from '../../../../../../shared/dbc-address-form/dbc-address-form';
import { DbcSwitch } from '../../../../../../shared/dbc-switch/dbc-switch';
import { Customer, customerActions } from '../../../../store/customer';
import { CustomerStore } from '../../../../store/customer/customer.store';
import { AddressGroup, SaleInvoiceCustomerForm } from '../../util/sale-invoice-form.type';
import { distinctUntilChanged, of, startWith, switchMap } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-sale-invoice-customer',
  imports: [ReactiveFormsModule, AutoComplete, DbcAddressForm, NgIcon, DbcSwitch],
  templateUrl: './sale-invoice-customer.html',
  styleUrl: './sale-invoice-customer.css'
})
export class SaleInvoiceCustomer {

  private readonly customerStore = inject(CustomerStore);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  readonly form = input.required<FormGroup<SaleInvoiceCustomerForm>>();

  readonly customers = this.customerStore.items;

  // UI-only state (not in form)
  readonly billingReadonly  = signal(true);
  readonly shippingReadonly = signal(true);

  readonly useBillingForShippingSig = toSignal(
    toObservable(this.form).pipe(
      switchMap(form => {
        const ctrl = form?.get('useBillingForShipping') as FormControl<boolean> | null;
        return ctrl
          ? ctrl.valueChanges.pipe(
              startWith(ctrl.value),
              distinctUntilChanged()
            )
          : of<boolean>(false);
      })
    ),
    { initialValue: false }
  );

  readonly billingAddressSig = toSignal(
    toObservable(this.form).pipe(
      switchMap(form => {
        const group = form?.get('billingaddress') as FormGroup<AddressGroup> | null;
        return group
          ? group.valueChanges.pipe(
              startWith(group.getRawValue() as unknown as AddressGroup),
              distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
            )
          : of<AddressGroup | null>(null);
      })
    ),
    { initialValue: null }
  );
  private logFx = effect(() => {
    const useBillingForShipping = this.useBillingForShippingSig();
    const billingAddress = this.billingAddressSig();
    if(useBillingForShipping && billingAddress) {
      if(billingAddress) {
        this.form().patchValue({ shippingaddress: {...this.form().controls['billingaddress'].value} });
      }
    }
  });

  onEditBillingAddress()  { this.billingReadonly.update(v => !v); }
  onEditShippingAddress() { this.shippingReadonly.update(v => !v); }

  findCustomerDisplayValue = (customer: Customer) => customer?.name ?? '';

  onCustomerSearch(value: string) {
    this.store.dispatch(customerActions.loadCustomers({ query: { search: { query: value, fields: ['name', 'mobile', 'description','email'] }, includes: ['currency'] } }));
  }

  onCustomerSelected(customer: Customer) {
    this.form().patchValue({ billingaddress: customer.address });
    if(this.form().controls['useBillingForShipping'].value) {
      this.form().patchValue({ shippingaddress: customer.address });
    }
    // this.form.patchValue({ customer: customer });
    // this.form.patchValue({ deliveryState: customer.state });
    // this.form.patchValue({ currency: customer.currency });
  }

  onNewCustomer() {
    const burl = this.router.url;
    this.router.navigate(['/app/trading/customer/create'], { queryParams: { burl } });
  }
}
