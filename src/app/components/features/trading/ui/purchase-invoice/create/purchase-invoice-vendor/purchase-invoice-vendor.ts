import { Component, effect, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Store } from '@ngrx/store';
import { AutoComplete } from '../../../../../../shared/auto-complete/auto-complete';
import { DbcAddressForm } from '../../../../../../shared/dbc-address-form/dbc-address-form';
import { DbcSwitch } from '../../../../../../shared/dbc-switch/dbc-switch';
import { Vendor, vendorActions } from '../../../../store/vendor';
import { VendorStore } from '../../../../store/vendor/vendor.store';
import { AddressGroup, PurchaseInvoiceVendorForm } from '../../util/purchase-invoice-form.type';
import { distinctUntilChanged, of, startWith, switchMap } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-purchase-invoice-vendor',
  imports: [ReactiveFormsModule, AutoComplete, DbcAddressForm, NgIcon, DbcSwitch],
  templateUrl: './purchase-invoice-vendor.html',
  styleUrl: './purchase-invoice-vendor.css'
})
export class PurchaseInvoiceVendor {

  private readonly vendorStore = inject(VendorStore);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  readonly form = input.required<FormGroup<PurchaseInvoiceVendorForm>>();

  readonly vendors = this.vendorStore.items;

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

  findVendorDisplayValue = (vendor: Vendor) => vendor?.name ?? '';

  onVendorSearch(value: string) {
    this.store.dispatch(vendorActions.loadVendors({ query: { search: { query: value, fields: ['name', 'mobile', 'description','email'] }, includes: ['currency'] } }));
  }

  onVendorSelected(vendor: Vendor) {
    this.form().patchValue({ billingaddress: vendor.address });
    if(this.form().controls['useBillingForShipping'].value) {
      this.form().patchValue({ shippingaddress: vendor.address });
    }
  }

  onNewVendor() {
    const burl = this.router.url;
    this.router.navigate(['/app/trading/vendor/create'], { queryParams: { burl } });
  }
}

