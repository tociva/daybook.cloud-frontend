import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  TngAutocompleteComponent,
  TngBadge,
  TngButtonComponent,
  TngFormFieldComponent,
  TngLabelComponent,
  TngSelectComponent,
} from '@tailng-ui/components';
import type { TngDateRangePickerSelectionInput } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { TngPopover, TngPopoverPanel, TngPopoverTrigger } from '@tailng-ui/primitives';
import { FiscalYearDatepickerComponent } from '../../../../../../../shared/fiscal-year-datepicker';
import { FiscalYearDateRangePickerComponent } from '../../../../../../../shared/fiscal-year-date-range-picker';
import type { ReportDateOperator } from '../../shared/report-date-query.util';
import { LedgerCategoryReportFacade } from '../ledger-category-report.facade';

@Component({
  selector: 'app-ledger-category-report-filter-popover',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
    TngBadge,
    TngButtonComponent,
    TngFormFieldComponent,
    TngIcon,
    TngLabelComponent,
    TngSelectComponent,
    TngPopover,
    TngPopoverPanel,
    TngPopoverTrigger,
    FiscalYearDatepickerComponent,
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
  protected readonly dateOperatorOptionLabel = this.facade.dateOperatorOptionLabel;
  protected readonly dateOperatorOptions = this.facade.dateOperatorOptions;
  protected readonly dateOperatorOptionValue = this.facade.dateOperatorOptionValue;
  protected readonly dateOperatorTrackBy = this.facade.dateOperatorTrackBy;
  protected readonly draftCategoryId = this.facade.draftCategoryId;
  protected readonly draftDateOperator = this.facade.draftDateOperator;
  protected readonly draftPickerValue = this.facade.draftPickerValue;
  protected readonly draftSingleDate = this.facade.draftSingleDate;
  protected readonly isDraftDateBetween = this.facade.isDraftDateBetween;
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

  protected onDraftDateOperatorChange(operator: ReportDateOperator | string | null): void {
    this.facade.onDraftDateOperatorChange(operator);
  }

  protected onDraftSingleDateChange(value: unknown): void {
    this.facade.onDraftSingleDateChange(value instanceof Date ? value : null);
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
