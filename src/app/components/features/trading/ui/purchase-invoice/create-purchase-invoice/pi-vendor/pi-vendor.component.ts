import { Component, computed, inject, input, signal } from '@angular/core';
import {
  TngAutocompleteComponent,
  TngError,
  TngFormFieldComponent,
  TngLabelComponent,
} from '@tailng-ui/components';
import type { Vendor } from '../../../../data/vendor';
import { PurchaseInvoiceDraftStore } from '../purchase-invoice-draft.store';
import { PiAddressDialogComponent } from './pi-address-dialog/pi-address-dialog.component';

@Component({
  selector: 'app-pi-vendor',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
    TngError,
    TngFormFieldComponent,
    TngLabelComponent,
    PiAddressDialogComponent,
  ],
  templateUrl: './pi-vendor.component.html',
  styleUrl: './pi-vendor.component.css',
})
export class PiVendorComponent {
  protected readonly draft = inject(PurchaseInvoiceDraftStore);
  readonly readOnly = input(false);

  protected readonly vendorOptionValue = (v: Vendor): string => v.id ?? '';
  protected readonly vendorOptionLabel = (v: Vendor): string => v.name ?? '';
  protected readonly vendorTrackBy = (_index: number, v: Vendor): unknown => v.id ?? '';

  /** Controls whether the address dialog is open */
  protected readonly addressDialogOpen = signal(false);

  protected readonly addressSummary = computed(() => {
    const parts = [
      this.draft.vendorAddressName(),
      this.draft.vendorAddressLine1(),
      this.draft.vendorAddressLine2(),
      this.draft.vendorAddressCity(),
      this.draft.vendorAddressState(),
      this.draft.vendorAddressZip(),
    ].filter(Boolean);
    return parts.join(', ');
  });

  protected onVendorValueChange(value: unknown): void {
    const id = typeof value === 'string' ? value : '';
    if (!id) return;
    const vendor = this.draft.filteredVendors().find((v) => v.id === id) ?? null;
    if (vendor) {
      this.draft.selectVendor(vendor);
      this.addressDialogOpen.set(false);
    }
  }

  protected clearVendor(): void {
    this.draft.onVendorSearchInput('');
    this.addressDialogOpen.set(false);
  }
}
