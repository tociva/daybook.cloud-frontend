import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngAutocompleteComponent,
  TngError,
  TngFormFieldComponent,
  TngLabelComponent,
} from '@tailng-ui/components';
import type { Vendor } from '../../../../data/vendor';
import { VendorStore } from '../../../../data/vendor';
import { PurchaseInvoiceDraftStore } from '../purchase-invoice-draft.store';
import { PiAddressDialogComponent } from './pi-address-dialog/pi-address-dialog.component';
import { PERMISSION } from '../../../../../../../core/permissions/permission-requirements';
import { PermissionsStore } from '../../../../../../../core/permissions/permissions.store';

/** Sentinel id used to represent the "Create new vendor" action inside the options list. */
const CREATE_VENDOR_SENTINEL_ID = '__create_vendor__';

/** A fake Vendor object that acts as the "create" action option. */
const CREATE_VENDOR_SENTINEL: Vendor = {
  id: CREATE_VENDOR_SENTINEL_ID,
  name: 'No vendors found — create one',
} as Vendor;

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
  private readonly vendorStore = inject(VendorStore);
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionsStore);
  readonly readOnly = input(false);
  readonly vendorSelected = output<void>();

  protected readonly vendorOptionValue = (v: Vendor): string => v.id ?? '';
  protected readonly vendorOptionLabel = (v: Vendor): string => v.name ?? '';
  protected readonly vendorTrackBy = (_index: number, v: Vendor): unknown => v.id ?? '';

  /** Expose sentinel id so the template can detect the create-action row. */
  protected readonly createSentinelId = CREATE_VENDOR_SENTINEL_ID;
  protected readonly canCreateVendor = computed(() =>
    this.permissions.can(PERMISSION.branch.vendor.create),
  );

  /**
   * Options list passed to the autocomplete.
   * When the filtered list is empty and the user has typed something, append the
   * sentinel "create" option so there is always something actionable to show.
   */
  protected readonly filteredVendorsWithCreate = computed(() => {
    const vendors = this.draft.filteredVendors();
    if (vendors.length === 0 && this.canCreateVendor()) {
      return [CREATE_VENDOR_SENTINEL];
    }
    return vendors;
  });

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
    // Intercept the sentinel — treat as "navigate to create vendor".
    if (id === CREATE_VENDOR_SENTINEL_ID) {
      this.createNewVendor();
      return;
    }
    const vendor = this.draft.filteredVendors().find((v) => v.id === id) ?? null;
    if (vendor) {
      this.draft.selectVendor(vendor);
      this.addressDialogOpen.set(false);
      this.vendorSelected.emit();
    }
  }

  protected clearVendor(): void {
    this.draft.onVendorSearchInput('');
    this.addressDialogOpen.set(false);
  }

  protected createNewVendor(): void {
    if (!this.canCreateVendor()) return;

    // Clear stale selected vendor so we can tell whether a new one was created on return.
    this.vendorStore.clearSelectedItem();
    void this.router.navigate(['/app/trading/vendor/create'], {
      queryParams: { burl: this.router.url },
    });
  }
}
