import { Component, inject, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Store } from '@ngrx/store';
import { AutoComplete } from '../../../../../../shared/auto-complete/auto-complete';
import { DbcAddressForm } from '../../../../../../shared/dbc-address-form/dbc-address-form';
import { Vendor, vendorActions } from '../../../../store/vendor';
import { VendorStore } from '../../../../store/vendor/vendor.store';
import { PurchaseInvoiceVendorForm } from '../../util/purchase-invoice-form.type';

@Component({
  selector: 'app-purchase-invoice-vendor',
  imports: [ReactiveFormsModule, AutoComplete, DbcAddressForm, NgIcon],
  templateUrl: './purchase-invoice-vendor.html',
  styleUrl: './purchase-invoice-vendor.css'
})
export class PurchaseInvoiceVendor {

  private readonly vendorStore = inject(VendorStore);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  readonly form = input.required<FormGroup<PurchaseInvoiceVendorForm>>();

  readonly vendors = this.vendorStore.items;

  findVendorDisplayValue = (vendor: Vendor) => vendor?.name ?? '';

  onVendorSearch(value: string) {
    this.store.dispatch(vendorActions.loadVendors({ query: { search: [{query: value, fields: ['name', 'mobile', 'description','email']}], includes: ['currency'] } }));
  }

  onVendorSelected(vendor: Vendor) {
    this.form().patchValue({ vendoraddress: vendor.address });
  }

  onNewVendor() {
    const burl = this.router.url;
    this.router.navigate(['/app/trading/vendor/create'], { queryParams: { burl } });
  }
}

