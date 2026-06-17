import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TngAutocompleteComponent,
  TngBadge,
  TngButtonComponent,
  TngCardComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngDateRangePickerSelectionInput, TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { TngPopover, TngPopoverPanel, TngPopoverTrigger } from '@tailng-ui/primitives';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { FiscalYearDateRangePickerComponent } from '../../../../../../shared/fiscal-year-date-range-picker';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import type { LedgerReportRow } from '../../../data/ledger-report/ledger-report.model';
import {
  buildAccountingReportSummaryMetrics,
  type AccountingReportSummaryMetric,
} from '../../../shared/accounting-report-summary.util';
import { createReportAmountFormatter, formatNetBalance } from '../../../shared/report-amount.util';
import { LedgerReportFacade } from './ledger-report.facade';

@Component({
  selector: 'app-ledger-report',
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
  templateUrl: './ledger-report.component.html',
  styleUrl: './ledger-report.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LedgerReportFacade],
})
export class LedgerReportComponent {
  private readonly facade = inject(LedgerReportFacade);
  private readonly dateManagement = inject(DateManagementService);
  private readonly userSessionStore = inject(UserSessionStore);

  protected readonly isLoading = this.facade.isLoading;
  protected readonly displayError = this.facade.displayError;
  protected readonly generatedAt = this.facade.generatedAt;
  protected readonly tableRows = this.facade.tableRows;
  protected readonly canViewLedgerReport = this.facade.canViewLedgerReport;
  protected readonly hasError = this.facade.hasError;
  protected readonly hasLedgerSelected = this.facade.hasLedgerSelected;
  protected readonly showSelectLedgerNotice = this.facade.showSelectLedgerNotice;
  protected readonly draftLedgerId = this.facade.draftLedgerId;
  protected readonly draftPickerValue = this.facade.draftPickerValue;
  protected readonly activeFilterCount = this.facade.activeFilterCount;
  protected readonly autocompleteLedgers = this.facade.autocompleteLedgers;
  protected readonly ledgerOptionValue = this.facade.ledgerOptionValue;
  protected readonly ledgerOptionLabel = this.facade.ledgerOptionLabel;
  protected readonly ledgerTrackBy = this.facade.ledgerTrackBy;
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

  protected readonly columns: readonly TngTableColumn<LedgerReportRow>[] = [
    { id: 'date', label: 'Date', width: '7.5rem' },
    { id: 'journalNumber', label: 'Journal #', width: '11rem' },
    { id: 'oppositeLedgers', label: 'Against', width: '14rem' },
    { id: 'debit', label: 'Debit', align: 'end', headerAlign: 'end', width: '8rem' },
    { id: 'credit', label: 'Credit', align: 'end', headerAlign: 'end', width: '8rem' },
    { id: 'balance', label: 'Balance', align: 'end', headerAlign: 'end', width: '9rem' },
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

  protected onRefresh(): void {
    this.facade.onRefresh();
  }

  protected formatDisplayDate(value: string | null | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected readonly formatGeneratedAt = (value: string | null | undefined): string =>
    this.dateManagement.formatDisplayDateTime(value, '—');

  protected formatRowBalance(row: LedgerReportRow): string {
    return formatNetBalance(row.balanceDebit, row.balanceCredit, this.formatAmount());
  }

  protected viewJournal(journalid: string): void {
    this.facade.viewJournal(journalid);
  }

  protected openOppositeLedger(ledgerid: string): void {
    this.facade.openOppositeLedger(ledgerid);
  }
}
