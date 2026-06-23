import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  TngAutocompleteComponent,
  TngBadge,
  TngButtonComponent,
} from '@tailng-ui/components';
import type { TngDateRangePickerSelectionInput } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { TngPopover, TngPopoverPanel, TngPopoverTrigger } from '@tailng-ui/primitives';
import { FiscalYearDateRangePickerComponent } from '../../../../../../../shared/fiscal-year-date-range-picker';
import { LedgerReportFacade } from '../ledger-report.facade';

@Component({
  selector: 'app-ledger-report-filter-popover',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
    TngBadge,
    TngButtonComponent,
    TngIcon,
    TngPopover,
    TngPopoverPanel,
    TngPopoverTrigger,
    FiscalYearDateRangePickerComponent,
  ],
  templateUrl: './ledger-report-filter-popover.component.html',
  styleUrl: './ledger-report-filter-popover.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LedgerReportFilterPopoverComponent {
  private readonly facade = inject(LedgerReportFacade);

  protected readonly activeFilterCount = this.facade.activeFilterCount;
  protected readonly autocompleteLedgers = this.facade.autocompleteLedgers;
  protected readonly draftLedgerId = this.facade.draftLedgerId;
  protected readonly draftPickerValue = this.facade.draftPickerValue;
  protected readonly ledgerOptionValue = this.facade.ledgerOptionValue;
  protected readonly ledgerOptionLabel = this.facade.ledgerOptionLabel;
  protected readonly ledgerTrackBy = this.facade.ledgerTrackBy;
  protected readonly filterOpen = signal(false);

  protected onFilterOpenChange(open: boolean): void {
    this.filterOpen.set(open);
    if (open) {
      this.facade.openFilterPopover();
    }
  }

  protected onDraftDateRangeChange(value: TngDateRangePickerSelectionInput<Date>): void {
    this.facade.onDraftDateRangeChange(value);
  }

  protected onDraftLedgerChange(ledgerid: string | null): void {
    this.facade.onDraftLedgerChange(ledgerid);
  }

  protected onLedgerQueryChange(query: string): void {
    this.facade.onLedgerQueryChange(query);
  }

  protected onApplyFilters(event: SubmitEvent): void {
    event.preventDefault();
    this.facade.applyFilters();
    this.filterOpen.set(false);
  }

  protected onClearFilters(): void {
    this.facade.clearFilters();
  }

  protected closeFilterPopover(): void {
    this.filterOpen.set(false);
  }
}
