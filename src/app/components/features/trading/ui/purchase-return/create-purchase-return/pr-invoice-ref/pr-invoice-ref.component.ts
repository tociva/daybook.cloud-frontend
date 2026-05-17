import { Component, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  TngAutocompleteComponent,
  TngError,
  TngFormFieldComponent,
  TngLabelComponent,
} from '@tailng-ui/components';
import type { PurchaseInvoice } from '../../../../data/purchase-invoice';
import { PurchaseReturnDraftStore } from '../purchase-return-draft.store';

@Component({
  selector: 'app-pr-invoice-ref',
  standalone: true,
  imports: [
    DecimalPipe,
    TngAutocompleteComponent,
    TngError,
    TngFormFieldComponent,
    TngLabelComponent,
  ],
  templateUrl: './pr-invoice-ref.component.html',
  styleUrl: './pr-invoice-ref.component.css',
})
export class PrInvoiceRefComponent {
  protected readonly draft = inject(PurchaseReturnDraftStore);
  readonly readOnly = input(false);

  protected readonly invoiceOptionValue = (inv: PurchaseInvoice): string => inv.id ?? '';
  protected readonly invoiceOptionLabel = (inv: PurchaseInvoice): string =>
    inv.number ? `${inv.number}${inv.vendor?.name ? ' — ' + inv.vendor.name : ''}` : inv.id ?? '';
  protected readonly invoiceTrackBy = (_index: number, inv: PurchaseInvoice): unknown =>
    inv.id ?? '';

  protected onInvoiceValueChange(value: unknown): void {
    const id = typeof value === 'string' ? value : '';
    if (!id) return;
    const invoice = this.draft.filteredInvoices().find((inv) => inv.id === id) ?? null;
    if (invoice) {
      this.draft.selectInvoice(invoice);
    }
  }

  protected clearInvoice(): void {
    this.draft.onInvoiceSearchInput('');
  }
}
