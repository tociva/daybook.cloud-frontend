import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Store } from '@ngrx/store';
import { combineLatest, startWith } from 'rxjs';
import { AutoComplete } from '../../../../../../shared/auto-complete/auto-complete';
import { DbcAddressForm } from '../../../../../../shared/dbc-address-form/dbc-address-form';
import { DbcSwitch } from '../../../../../../shared/dbc-switch/dbc-switch';
import { customerActions } from '../../../../store/customer';
import { Customer } from '../../../../store/customer/customer.model';
import { CustomerStore } from '../../../../store/customer/customer.store';
import { SaleInvoiceCustomerForm } from '../../util/sale-invoice-form.type';

@Component({
  selector: 'app-sale-invoice-customer',
  imports: [ReactiveFormsModule,AutoComplete, DbcAddressForm, DbcSwitch, NgIcon],
  templateUrl: './sale-invoice-customer.html',
  styleUrl: './sale-invoice-customer.css'
})
export class SaleInvoiceCustomer {

  private readonly customerStore = inject(CustomerStore);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  
  readonly form = input.required<FormGroup<SaleInvoiceCustomerForm>>();
  
  protected readonly billingReadonly  = signal<boolean>(true);
  protected readonly shippingReadonly = signal<boolean>(true);
  protected readonly customers = this.customerStore.items;

  get useBillingForShipping(): boolean {
    return this.form().controls.useBillingForShipping.value;
  }

  private readonly initializeBillingForShippingSig = () => {
    const form = this.form();
    const billingGroup   = form.controls.billingaddress;
    const shippingGroup  = form.controls.shippingaddress;
    const useBillingCtrl = form.controls.useBillingForShipping;

    combineLatest([
      useBillingCtrl.valueChanges.pipe(startWith(useBillingCtrl.value)),
      billingGroup.valueChanges.pipe(startWith(billingGroup.value)),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([useBilling, billingAddress]) => {
        if (useBilling && billingAddress) {
          // keep shipping in sync with billing when toggle is ON
          shippingGroup.patchValue(billingAddress);
        }
      });
  };

  ngOnInit(): void {
    this.initializeBillingForShippingSig();
  }
  onNewCustomer = () => {
    const burl = this.router.url;
    this.router.navigate(['/app/trading/customer/create'], { queryParams: { burl } });
  }

  onCustomerSelected = (customer: Customer) => {
    this.form().patchValue({ billingaddress: customer.address });
    if(this.form().controls['useBillingForShipping'].value) {
      this.form().patchValue({ shippingaddress: customer.address });
    }
  }

  onCustomerSearch = (value: string) => {
    this.store.dispatch(customerActions.loadCustomers({ query: { search: [{query: value, fields: ['name', 'mobile', 'description','email']}], includes: ['currency'] } }));
  }

  findCustomerDisplayValue = (customer: Customer) => customer?.name ?? '';

  onEditBillingAddress()  { this.billingReadonly.update(v => !v); }
  onEditShippingAddress() { this.shippingReadonly.update(v => !v); }

}
