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
import { LedgerCategoryReportFacade } from '../ledger-category-report.facade';

@Component({
  selector: 'app-ledger-category-report-filter-popover',
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
  templateUrl: './ledger-category-report-filter-popover.component.html',
  styleUrl: './ledger-category-report-filter-popover.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LedgerCategoryReportFilterPopoverComponent {
  private readonly facade = inject(LedgerCategoryReportFacade);

  protected readonly activeFilterCount = this.facade.activeFilterCount;
  protected readonly autocompleteCategories = this.facade.autocompleteCategories;
  protected readonly draftCategoryId = this.facade.draftCategoryId;
  protected readonly draftPickerValue = this.facade.draftPickerValue;
  protected readonly categoryOptionValue = this.facade.categoryOptionValue;
  protected readonly categoryOptionLabel = this.facade.categoryOptionLabel;
  protected readonly categoryTrackBy = this.facade.categoryTrackBy;
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

  protected onDraftCategoryChange(ledgercategoryid: string | null): void {
    this.facade.onDraftCategoryChange(ledgercategoryid);
  }

  protected onCategoryQueryChange(query: string): void {
    this.facade.onCategoryQueryChange(query);
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
