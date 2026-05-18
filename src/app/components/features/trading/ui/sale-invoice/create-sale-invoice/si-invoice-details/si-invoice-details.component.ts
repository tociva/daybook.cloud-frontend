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
  TngSwitchComponent,
} from '@tailng-ui/components';
import { DatepickerDateAdapterService } from '../../../../../../../core/date/datepicker-date-adapter.service';
import { DateManagementService } from '../../../../../../../core/date/date-management.service';
import { FiscalYearDatepickerComponent } from '../../../../../../../shared/fiscal-year-datepicker';
import type { Currency } from '../../../../../management/data/currency/currency.model';
import { CurrencyStore } from '../../../../../management/data/currency/currency.store';
import { SaleInvoiceDraftStore, type SelectOption } from '../sale-invoice-draft.store';

@Component({
  selector: 'app-si-invoice-details',
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
    TngSwitchComponent,
  ],
  templateUrl: './si-invoice-details.component.html',
  styleUrl: './si-invoice-details.component.css',
})
export class SiInvoiceDetailsComponent {
  protected readonly draft = inject(SaleInvoiceDraftStore);
  protected readonly datepickerAdapter = inject(DatepickerDateAdapterService);
  private readonly dateManagement = inject(DateManagementService);
  private readonly currencyStore = inject(CurrencyStore);
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
        `${c.name} (${c.symbol})`.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  });

  protected readonly currencyOptionValue = (c: Currency): string => c.code;
  protected readonly currencyOptionLabel = (c: Currency): string => `${c.name} (${c.symbol})`;
  protected readonly currencyTrackBy = (_index: number, c: Currency): string => c.code;

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
