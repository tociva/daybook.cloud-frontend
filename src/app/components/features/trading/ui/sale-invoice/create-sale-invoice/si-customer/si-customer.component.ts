import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngAutocompleteComponent,
  TngError,
  TngFormFieldComponent,
  TngLabelComponent,
} from '@tailng-ui/components';
import type { Customer } from '../../../../data/customer';
import { CustomerStore } from '../../../../data/customer';
import { SaleInvoiceDraftStore } from '../sale-invoice-draft.store';
import { SiAddressDialogComponent } from './si-address-dialog/si-address-dialog.component';

/** Sentinel id used to represent the "Create new customer" action inside the options list. */
const CREATE_CUSTOMER_SENTINEL_ID = '__create_customer__';

/** A fake Customer object that acts as the "create" action option. */
const CREATE_CUSTOMER_SENTINEL: Customer = {
  id: CREATE_CUSTOMER_SENTINEL_ID,
  name: 'No customers found — create one',
} as Customer;

@Component({
  selector: 'app-si-customer',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
    TngError,
    TngFormFieldComponent,
    TngLabelComponent,
    SiAddressDialogComponent,
  ],
  templateUrl: './si-customer.component.html',
  styleUrl: './si-customer.component.css',
})
export class SiCustomerComponent {
  protected readonly draft = inject(SaleInvoiceDraftStore);
  private readonly customerStore = inject(CustomerStore);
  private readonly router = inject(Router);
  readonly readOnly = input(false);

  protected readonly customerOptionValue = (c: Customer): string => c.id ?? '';
  protected readonly customerOptionLabel = (c: Customer): string => c.name ?? '';
  protected readonly customerTrackBy = (_index: number, c: Customer): unknown => c.id ?? '';

  /** Expose sentinel id so the template can detect the create-action row. */
  protected readonly createSentinelId = CREATE_CUSTOMER_SENTINEL_ID;

  /**
   * Options list passed to the autocomplete.
   * When the filtered list is empty and the user has typed something, append the
   * sentinel "create" option so there is always something actionable to show.
   */
  protected readonly filteredCustomersWithCreate = computed(() => {
    const customers = this.draft.filteredCustomers();
    if (customers.length === 0) {
      return [CREATE_CUSTOMER_SENTINEL];
    }
    return customers;
  });

  /** Controls whether the address dialog is open */
  protected readonly addressDialogOpen = signal(false);

  protected readonly billingAddressSummary = computed(() => {
    const parts = [
      this.draft.billingName(),
      this.draft.billingLine1(),
      this.draft.billingLine2(),
      this.draft.billingCity(),
      this.draft.billingState(),
      this.draft.billingZip(),
    ].filter(Boolean);
    return parts.join(', ');
  });

  protected readonly shippingAddressSummary = computed(() => {
    if (this.draft.useBillingForShipping()) return 'Same as billing';
    const parts = [
      this.draft.shippingName(),
      this.draft.shippingLine1(),
      this.draft.shippingLine2(),
      this.draft.shippingCity(),
      this.draft.shippingState(),
      this.draft.shippingZip(),
    ].filter(Boolean);
    return parts.join(', ') || '—';
  });

  protected onCustomerValueChange(value: unknown): void {
    const id = typeof value === 'string' ? value : '';
    if (!id) return;
    // Intercept the sentinel — treat as "navigate to create customer".
    if (id === CREATE_CUSTOMER_SENTINEL_ID) {
      this.createNewCustomer();
      return;
    }
    const customer = this.draft.filteredCustomers().find((c) => c.id === id) ?? null;
    if (customer) {
      this.draft.selectCustomer(customer);
      this.addressDialogOpen.set(false);
    }
  }

  protected clearCustomer(): void {
    this.draft.onCustomerSearchInput('');
    this.addressDialogOpen.set(false);
  }

  protected createNewCustomer(): void {
    // Clear stale selected customer so we can tell whether a new one was created on return.
    this.customerStore.clearSelectedItem();
    this.draft.saveDraft();
    void this.router.navigate(['/app/trading/customer/create'], {
      queryParams: { burl: this.router.url },
    });
  }
}
