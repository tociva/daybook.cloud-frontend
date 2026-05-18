import { Component, computed, inject, input, signal } from '@angular/core';
import {
  TngAutocompleteComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngDatepickerComponent,
  TngError,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
  TngSelectComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { DatepickerDateAdapterService } from '../../../../../../../core/date/datepicker-date-adapter.service';
import { DateManagementService } from '../../../../../../../core/date/date-management.service';
import { FiscalYearDatepickerComponent } from '../../../../../../../shared/fiscal-year-datepicker';
import type { Currency } from '../../../../../management/data/currency/currency.model';
import { CurrencyStore } from '../../../../../management/data/currency/currency.store';
import { PurchaseInvoiceDraftStore, type SelectOption } from '../purchase-invoice-draft.store';

@Component({
  selector: 'app-pi-invoice-details',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngDatepickerComponent,
    TngError,
    TngFormFieldComponent,
    FiscalYearDatepickerComponent,
    TngInputComponent,
    TngLabelComponent,
    TngSelectComponent,
    TngTextareaComponent,
  ],
  templateUrl: './pi-invoice-details.component.html',
  styleUrl: './pi-invoice-details.component.css',
})
export class PiInvoiceDetailsComponent {
  protected readonly draft = inject(PurchaseInvoiceDraftStore);
  protected readonly datepickerAdapter = inject(DatepickerDateAdapterService);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly currencyStore = inject(CurrencyStore);
  readonly readOnly = input(false);

  readonly getOptionLabel = (o: SelectOption): string => o.label;
  readonly getOptionValue = (o: SelectOption): string => o.value;
  readonly trackByValue = (_: number, o: SelectOption): string => o.value;

  // ── Currency autocomplete ────────────────────────────────────────────────

  protected readonly currencyQuery = signal('');

  protected readonly filteredCurrencies = computed<Currency[]>(() => {
    const q = this.currencyQuery();
    const currencies = this.currencyStore.currencies();
    if (!q) return [...currencies];
    return currencies.filter(
      (c) =>
        `${c.name} (${c.symbol})`.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  });

  protected readonly currencyOptionValue = (c: Currency): string => c.code;
  protected readonly currencyOptionLabel = (c: Currency): string => `${c.name} (${c.symbol})`;
  protected readonly currencyTrackBy = (_index: number, c: Currency): string => c.code;

  /** Full label (name + symbol) for the currently selected currency, shown in read-only mode. */
  protected readonly selectedCurrencyLabel = computed(() => {
    const code = this.draft.currencycode();
    const found = this.currencyStore.currencies().find((c) => c.code === code);
    return found ? `${found.name} (${found.symbol})` : code;
  });

  constructor() {
    void this.currencyStore.load();
  }

  protected onCurrencyQueryChange(event: unknown): void {
    this.currencyQuery.set(typeof event === 'string' ? event.trim().toLowerCase() : '');
  }

  protected onCurrencyValueChange(event: unknown): void {
    const code = typeof event === 'string' ? event : '';
    if (code) this.draft.currencycode.set(code);
  }

  protected formatDate(value: string): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }
}
