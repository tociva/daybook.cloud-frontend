import { Component, computed, effect, inject, input, model } from '@angular/core';
import {
  TngAutocompleteComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngInputComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import type { VendorPaymentInvoiceRequest } from '../../../../data/vendor-payment';
import type { PurchaseInvoice } from '../../../../data/purchase-invoice/purchase-invoice.model';
import { PurchaseInvoiceStore } from '../../../../data/purchase-invoice';
import { DateManagementService } from '../../../../../../../core/date/date-management.service';
import {
  allocationTotal,
  formatCurrencyAmount,
  formatMoneyAmount,
  invoiceBalanceSummary,
  invoiceTotal,
  isExcessPayment,
  outstandingBalance,
  paymentRemaining,
  paymentRemainingSummaryLabel,
} from '../vendor-payment-invoice-allocation.util';

// ── Row model (exported so parent can type invoiceRows signal) ────────────────

export interface InvoiceRow {
  invoice: PurchaseInvoice | null;
  invoiceSearch: string;
  amount: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-vpmt-invoice-lines',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngInputComponent,
    TngIcon,
  ],
  templateUrl: './vpmt-invoice-lines.component.html',
  styleUrl: './vpmt-invoice-lines.component.css',
})
export class VpmtInvoiceLinesComponent {
  private readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  private readonly dateManagement = inject(DateManagementService);

  // ── Inputs / model ──────────────────────────────────────────────────────────

  readonly vendorId = input('');
  readonly currencycode = input('INR');
  readonly paymentAmount = input(0);
  readonly currentVendorPaymentId = input<string | null>(null);
  /** Set to true in edit mode so the effect does not auto-load and overwrite
   *  the rows that were patched in by the parent from the payment data. */
  readonly editMode = input(false);
  /** Two-way binding: child writes rows, parent reads them for submit/stepper. */
  readonly rows = model<InvoiceRow[]>([]);

  // ── Computed ────────────────────────────────────────────────────────────────

  protected readonly filteredInvoices = computed<PurchaseInvoice[]>(() => {
    const vendorId = this.vendorId();
    const items = this.purchaseInvoiceStore.items() as PurchaseInvoice[];
    return (vendorId ? items.filter((inv) => inv.vendorid === vendorId) : items).slice(0, 15);
  });

  protected readonly allocatedTotal = computed(() =>
    formatMoneyAmount(allocationTotal(this.rows())),
  );

  protected readonly paymentRemaining = computed(() =>
    formatMoneyAmount(paymentRemaining(this.paymentAmount(), this.rows())),
  );

  protected readonly paymentRemainingIsNegative = computed(
    () => paymentRemaining(this.paymentAmount(), this.rows()) < 0,
  );

  protected readonly paymentRemainingSummaryLabel = computed(() =>
    paymentRemainingSummaryLabel(this.paymentAmount(), this.rows(), {
      currentVendorPaymentId: this.currentVendorPaymentId(),
    }),
  );

  protected readonly paymentIsExcess = computed(() =>
    isExcessPayment(this.paymentAmount(), this.rows(), {
      currentVendorPaymentId: this.currentVendorPaymentId(),
    }),
  );

  /** Exposed so the parent stepper can track completion. */
  readonly hasLinkedInvoices = computed(() => this.rows().some((r) => r.invoice !== null));

  // ── Autocomplete helpers ────────────────────────────────────────────────────

  protected readonly invoiceOptionValue = (inv: PurchaseInvoice): string => inv.id ?? '';
  protected readonly invoiceOptionLabel = (inv: PurchaseInvoice): string =>
    this.invoiceDisplayName(inv);
  protected readonly invoiceTrackBy = (_i: number, inv: PurchaseInvoice): string => inv.id ?? '';

  /** Always includes the row's pre-selected invoice so the autocomplete can
   *  resolve its label even when it falls outside the 15-item slice. */
  protected invoiceOptionsForRow(row: InvoiceRow): PurchaseInvoice[] {
    const base = this.filteredInvoices();
    if (!row.invoice) return base;
    return base.some((inv) => inv.id === row.invoice!.id) ? base : [row.invoice, ...base];
  }

  // ── Auto-load effect ────────────────────────────────────────────────────────

  constructor() {
    effect(() => {
      if (this.editMode()) return; // rows are controlled by the parent in edit mode
      const id = this.vendorId();
      if (!id) {
        this.rows.set([]);
        return;
      }
      void this.loadAndPrefill(id);
    });
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async loadAndPrefill(vendorId: string): Promise<void> {
    await this.purchaseInvoiceStore.loadPurchaseInvoices({
      includes: [{ relation: 'payments' }],
      where: { vendorid: vendorId },
    });
    const invoices = this.purchaseInvoiceStore.items() as PurchaseInvoice[];
    this.rows.set(
      invoices.length
        ? invoices.map((inv) => ({
            invoice: inv,
            invoiceSearch: this.invoiceDisplayName(inv),
            amount: outstandingBalance(inv),
          }))
        : [this.emptyRow()],
    );
  }

  private emptyRow(): InvoiceRow {
    return { invoice: null, invoiceSearch: '', amount: 0 };
  }

  // ── Row mutation handlers ───────────────────────────────────────────────────

  protected addRow(): void {
    this.rows.update((rows) => [...rows, this.emptyRow()]);
  }

  protected removeRow(row: InvoiceRow): void {
    this.rows.update((rows) => {
      const next = rows.filter((r) => r !== row);
      return next.length ? next : [this.emptyRow()];
    });
  }

  protected onQueryChange(event: unknown, row: InvoiceRow): void {
    const q = typeof event === 'string' ? event : '';
    const idx = this.rows().indexOf(row);
    if (idx === -1) return;
    this.rows.update((rows) => rows.map((r, i) => (i === idx ? { ...r, invoiceSearch: q } : r)));
    const vendorId = this.vendorId();
    void this.purchaseInvoiceStore.loadPurchaseInvoices(
      q
        ? {
            includes: [{ relation: 'payments' }],
            where: {
              and: [{ number: { ilike: `%${q}%` } }, ...(vendorId ? [{ vendorid: vendorId }] : [])],
            },
          }
        : vendorId
          ? { includes: [{ relation: 'payments' }], where: { vendorid: vendorId } }
          : { includes: [{ relation: 'payments' }] },
    );
  }

  protected onValueChange(value: unknown, row: InvoiceRow): void {
    const id = typeof value === 'string' ? value : '';
    const idx = this.rows().indexOf(row);
    if (idx === -1) return;
    if (!id) {
      this.rows.update((rows) =>
        rows.map((r, i) => (i === idx ? { ...r, invoice: null, invoiceSearch: '' } : r)),
      );
      return;
    }
    const invoice = this.filteredInvoices().find((inv) => inv.id === id) ?? null;
    if (invoice) {
      this.rows.update((rows) =>
        rows.map((r, i) =>
          i === idx ? { ...r, invoice, invoiceSearch: this.invoiceDisplayName(invoice) } : r,
        ),
      );
    }
  }

  protected updateAmount(row: InvoiceRow, value: string | null): void {
    const num = Number(value ?? '0') || 0;
    const idx = this.rows().indexOf(row);
    if (idx === -1) return;
    this.rows.update((rows) => rows.map((r, i) => (i === idx ? { ...r, amount: num } : r)));
  }

  protected invoiceDisplayName(invoice: PurchaseInvoice): string {
    const parts: string[] = [];
    if (invoice.number) parts.push(invoice.number);
    const formattedDate = this.dateManagement.formatDisplayDate(invoice.date, '');
    if (formattedDate) parts.push(`dated ${formattedDate}`);
    if (invoice.grandtotal != null)
      parts.push(`(${invoiceBalanceSummary(invoice, this.currencycode())})`);
    return parts.join(' ');
  }

  protected invoiceTotalText(invoice: PurchaseInvoice | null): string {
    return invoice ? formatCurrencyAmount(this.currencycode(), invoiceTotal(invoice)) : '-';
  }

  protected outstandingBalanceText(invoice: PurchaseInvoice | null): string {
    return invoice ? formatCurrencyAmount(this.currencycode(), outstandingBalance(invoice)) : '-';
  }

  // ── Public API for parent submit ────────────────────────────────────────────

  getInvoiceRequests(): VendorPaymentInvoiceRequest[] {
    return this.rows()
      .filter((r) => r.invoice?.id)
      .map((r) => ({ purchaseinvoiceid: r.invoice!.id!, amount: r.amount }));
  }
}
