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
import type { CustomerReceiptInvoiceRequest } from '../../../../data/customer-receipt';
import type { SaleInvoice } from '../../../../data/sale-invoice/sale-invoice.model';
import { SaleInvoiceStore } from '../../../../data/sale-invoice';
import { DateManagementService } from '../../../../../../../core/date/date-management.service';

// ── Row model (exported so parent can type invoiceRows signal) ────────────────

export interface InvoiceRow {
  invoice: SaleInvoice | null;
  invoiceSearch: string;
  amount: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-rcpt-invoice-lines',
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
  templateUrl: './rcpt-invoice-lines.component.html',
  styleUrl: './rcpt-invoice-lines.component.css',
})
export class RcptInvoiceLinesComponent {
  private readonly saleInvoiceStore = inject(SaleInvoiceStore);
  private readonly dateManagement = inject(DateManagementService);

  // ── Inputs / model ──────────────────────────────────────────────────────────

  readonly customerId = input('');
  readonly currencycode = input('INR');
  /** Set to true in edit mode so the effect does not auto-load and overwrite
   *  the rows that were patched in by the parent from the receipt data. */
  readonly editMode = input(false);
  /** Two-way binding: child writes rows, parent reads them for submit/stepper. */
  readonly rows = model<InvoiceRow[]>([]);

  // ── Computed ────────────────────────────────────────────────────────────────

  protected readonly filteredInvoices = computed<SaleInvoice[]>(() => {
    const customerId = this.customerId();
    const items = this.saleInvoiceStore.items() as SaleInvoice[];
    return (customerId ? items.filter((inv) => inv.customerid === customerId) : items).slice(0, 15);
  });

  protected readonly invoicesTotal = computed(() =>
    this.rows()
      .reduce((s, r) => s + (Number(r.amount) || 0), 0)
      .toFixed(2),
  );

  /** Exposed so the parent stepper can track completion. */
  readonly hasLinkedInvoices = computed(() => this.rows().some((r) => r.invoice !== null));

  // ── Autocomplete helpers ────────────────────────────────────────────────────

  protected readonly invoiceOptionValue = (inv: SaleInvoice): string => inv.id ?? '';
  protected readonly invoiceOptionLabel = (inv: SaleInvoice): string =>
    this.invoiceDisplayName(inv);
  protected readonly invoiceTrackBy = (_i: number, inv: SaleInvoice): string => inv.id ?? '';

  /** Always includes the row's pre-selected invoice so the autocomplete can
   *  resolve its label even when it falls outside the 15-item slice. */
  protected invoiceOptionsForRow(row: InvoiceRow): SaleInvoice[] {
    const base = this.filteredInvoices();
    if (!row.invoice) return base;
    return base.some((inv) => inv.id === row.invoice!.id) ? base : [row.invoice, ...base];
  }

  // ── Auto-load effect ────────────────────────────────────────────────────────

  constructor() {
    effect(() => {
      if (this.editMode()) return; // rows are controlled by the parent in edit mode
      const id = this.customerId();
      if (!id) {
        this.rows.set([]);
        return;
      }
      void this.loadAndPrefill(id);
    });
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async loadAndPrefill(customerId: string): Promise<void> {
    await this.saleInvoiceStore.loadSaleInvoices({ where: { customerid: customerId } });
    const invoices = this.saleInvoiceStore.items() as SaleInvoice[];
    this.rows.set(
      invoices.length
        ? invoices.map((inv) => ({
            invoice: inv,
            invoiceSearch: this.invoiceDisplayName(inv),
            amount: inv.grandtotal ?? 0,
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
    const customerId = this.customerId();
    void this.saleInvoiceStore.loadSaleInvoices(
      q
        ? {
            where: {
              and: [
                { number: { ilike: `%${q}%` } },
                ...(customerId ? [{ customerid: customerId }] : []),
              ],
            },
          }
        : customerId
          ? { where: { customerid: customerId } }
          : {},
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

  protected invoiceDisplayName(invoice: SaleInvoice): string {
    const parts: string[] = [];
    if (invoice.number) parts.push(invoice.number);
    const formattedDate = this.dateManagement.formatDisplayDate(invoice.date, '');
    if (formattedDate) parts.push(`dated ${formattedDate}`);
    if (invoice.grandtotal != null)
      parts.push(`(${this.currencycode()} ${invoice.grandtotal.toFixed(2)})`);
    return parts.join(' ');
  }

  // ── Public API for parent submit ────────────────────────────────────────────

  getInvoiceRequests(): CustomerReceiptInvoiceRequest[] {
    return this.rows()
      .filter((r) => r.invoice?.id)
      .map((r) => ({ saleinvoiceid: r.invoice!.id!, amount: r.amount }));
  }
}
