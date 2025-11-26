import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Store } from '@ngrx/store';
import { AutoComplete } from '../../../../../../shared/auto-complete/auto-complete';
import { DbcAddressForm } from '../../../../../../shared/dbc-address-form/dbc-address-form';
import { DbcSwitch } from '../../../../../../shared/dbc-switch/dbc-switch';
import { vendorActions } from '../../../../store/vendor';
import { Vendor } from '../../../../store/vendor/vendor.model';
import { VendorStore } from '../../../../store/vendor/vendor.store';
import { PurchaseInvoiceVendorForm } from '../../util/purchase-invoice-form.type';

@Component({
  selector: 'app-purchase-invoice-vendor',
  imports: [ReactiveFormsModule, AutoComplete, DbcAddressForm, DbcSwitch, NgIcon],
  templateUrl: './purchase-invoice-vendor.html',
  styleUrl: './purchase-invoice-vendor.css'
})
export class PurchaseInvoiceVendor {

  private readonly vendorStore = inject(VendorStore);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  
  readonly form = input.required<FormGroup<PurchaseInvoiceVendorForm>>();
  
  protected readonly vendoraddressReadonly  = signal<boolean>(true);
  protected readonly vendors = this.vendorStore.items;



  onNewVendor = () => {
    const burl = this.router.url;
    this.router.navigate(['/app/trading/vendor/create'], { queryParams: { burl } });
  }

  onVendorSelected = (vendor: Vendor) => {
    this.form().patchValue({ vendoraddress: vendor.address });
  }

  onVendorSearch = (value: string) => {
    this.store.dispatch(vendorActions.loadVendors({ query: { search: [{query: value, fields: ['name', 'mobile', 'description','email']}], includes: ['currency'] } }));
  }

  findVendorDisplayValue = (vendor: Vendor) => vendor?.name ?? '';

  onEditVendorAddress()  { this.vendoraddressReadonly.update(v => !v); }

}

