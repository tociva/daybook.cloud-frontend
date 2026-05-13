import { Component, computed, inject, signal } from '@angular/core';
import {
  TngAutocompleteComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngLabelComponent,
} from '@tailng-ui/components';
import type { Customer } from '../../../../data/customer';
import { SaleInvoiceDraftStore } from '../sale-invoice-draft.store';
import { SiAddressDialogComponent } from './si-address-dialog/si-address-dialog.component';

@Component({
  selector: 'app-si-customer',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngLabelComponent,
    SiAddressDialogComponent,
  ],
  templateUrl: './si-customer.component.html',
  styleUrl: './si-customer.component.css',
})
export class SiCustomerComponent {
  protected readonly draft = inject(SaleInvoiceDraftStore);

  protected readonly customerOptionValue = (c: Customer): string => c.id ?? '';
  protected readonly customerOptionLabel = (c: Customer): string => c.name ?? '';
  protected readonly customerTrackBy = (_index: number, c: Customer): unknown => c.id ?? '';

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
}
