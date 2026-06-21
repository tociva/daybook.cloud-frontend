import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TngAutocompleteComponent,
  TngBadge,
  TngButtonComponent,
  TngCardComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type {
  TngDateRangePickerSelectionInput,
  TngTableColumn,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { TngPopover, TngPopoverPanel, TngPopoverTrigger } from '@tailng-ui/primitives';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { FiscalYearDateRangePickerComponent } from '../../../../../../shared/fiscal-year-date-range-picker';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import type { LedgerCategoryReportRow } from '../../../data/ledger-category-report/ledger-category-report.model';
import {
  buildAccountingReportSummaryMetrics,
  type AccountingReportSummaryMetric,
} from '../../../shared/accounting-report-summary.util';
import { createReportAmountFormatter, formatNetBalance } from '../../../shared/report-amount.util';
import { LedgerCategoryReportFacade } from './ledger-category-report.facade';

@Component({
  selector: 'app-ledger-category-report',
  standalone: true,
  imports: [
    CommonModule,
    PageHeadingComponent,
    TngBadge,
    TngButtonComponent,
    TngCardComponent,
    TngIcon,
    TngPopover,
    TngPopoverPanel,
    TngPopoverTrigger,
    TngTable,
    TngTableCellTpl,
    TngAutocompleteComponent,
    FiscalYearDateRangePickerComponent,
  ],
  templateUrl: './ledger-category-report.component.html',
  styleUrl: './ledger-category-report.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LedgerCategoryReportFacade],
})
export class LedgerCategoryReportComponent {
  private readonly facade = inject(LedgerCategoryReportFacade);
  private readonly dateManagement = inject(DateManagementService);
  private readonly userSessionStore = inject(UserSessionStore);

  protected readonly isLoading = this.facade.isLoading;
  protected readonly displayError = this.facade.displayError;
  protected readonly generatedAt = this.facade.generatedAt;
  protected readonly tableRows = this.facade.tableRows;
  protected readonly canViewLedgerCategoryReport = this.facade.canViewLedgerCategoryReport;
  protected readonly canOpenLedgerReport = this.facade.canOpenLedgerReport;
  protected readonly hasError = this.facade.hasError;
  protected readonly hasCategorySelected = this.facade.hasCategorySelected;
  protected readonly showSelectCategoryNotice = this.facade.showSelectCategoryNotice;
  protected readonly draftCategoryId = this.facade.draftCategoryId;
  protected readonly draftPickerValue = this.facade.draftPickerValue;
  protected readonly activeFilterCount = this.facade.activeFilterCount;
  protected readonly autocompleteCategories = this.facade.autocompleteCategories;
  protected readonly categoryOptionValue = this.facade.categoryOptionValue;
  protected readonly categoryOptionLabel = this.facade.categoryOptionLabel;
  protected readonly categoryTrackBy = this.facade.categoryTrackBy;
  protected readonly filterOpen = signal(false);

  protected readonly currencyMinorUnit = computed(() => {
    const currency = this.userSessionStore.session()?.fiscalyear?.currency;
    const minor = currency?.minorunit;
    return typeof minor === 'number' && minor >= 0 ? minor : 2;
  });

  protected readonly currencySymbol = computed(
    () => this.userSessionStore.session()?.fiscalyear?.currency?.symbol || '₹',
  );

  protected readonly formatAmount = computed(() =>
    createReportAmountFormatter(this.currencyMinorUnit()),
  );

  protected readonly summaryMetrics = computed<readonly AccountingReportSummaryMetric[]>(() =>
    buildAccountingReportSummaryMetrics(
      this.facade.summary(),
      this.currencyMinorUnit(),
      this.currencySymbol(),
    ),
  );

  protected readonly columns: readonly TngTableColumn<LedgerCategoryReportRow>[] = [
    { id: 'date', label: 'Date', width: '7.5rem' },
    { id: 'journalNumber', label: 'Journal #', width: '10rem' },
    { id: 'ledgerName', label: 'Ledger', width: '12rem' },
    { id: 'ledgerCategoryName', label: 'Category', width: '12rem' },
    { id: 'oppositeLedgers', label: 'Against', width: '12rem' },
    { id: 'debit', label: 'Debit', align: 'end', headerAlign: 'end', width: '7.5rem' },
    { id: 'credit', label: 'Credit', align: 'end', headerAlign: 'end', width: '7.5rem' },
    { id: 'balance', label: 'Balance', align: 'end', headerAlign: 'end', width: '8.5rem' },
    { id: 'description', label: 'Description', truncate: true },
  ];

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

  protected onRefresh(): void {
    this.facade.onRefresh();
  }

  protected formatDisplayDate(value: string | null | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected readonly formatGeneratedAt = (value: string | null | undefined): string =>
    this.dateManagement.formatDisplayDateTime(value, '—');

  protected formatRowBalance(row: LedgerCategoryReportRow): string {
    return formatNetBalance(row.balanceDebit, row.balanceCredit, this.formatAmount());
  }

  protected viewJournal(journalid: string): void {
    this.facade.viewJournal(journalid);
  }

  protected openRowLedger(ledgerid: string): void {
    this.facade.openRowLedger(ledgerid);
  }

  protected openOppositeLedger(ledgerid: string): void {
    this.facade.openOppositeLedger(ledgerid);
  }
}
