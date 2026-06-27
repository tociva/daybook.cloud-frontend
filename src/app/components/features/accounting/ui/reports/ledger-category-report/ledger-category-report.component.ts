import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TngAutocompleteComponent,
  TngButtonComponent,
  TngCardComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import { journalSourceTypeLabel } from '../../../data/journal';
import type { LedgerCategoryReportRow } from '../../../data/ledger-category-report/ledger-category-report.model';
import {
  buildAccountingReportSummaryMetrics,
  type AccountingReportSummaryMetric,
} from '../../../shared/accounting-report-summary.util';
import { createReportAmountFormatter, formatNetBalance } from '../../../shared/report-amount.util';
import { LedgerCategoryReportFilterPopoverComponent } from './ledger-category-report-filter-popover/ledger-category-report-filter-popover.component';
import { LedgerCategoryReportFacade } from './ledger-category-report.facade';

@Component({
  selector: 'app-ledger-category-report',
  standalone: true,
  imports: [
    CommonModule,
    PageHeadingComponent,
    BurlBackButtonComponent,
    TngAutocompleteComponent,
    TngButtonComponent,
    TngCardComponent,
    TngIcon,
    TngTable,
    TngTableCellTpl,
    LedgerCategoryReportFilterPopoverComponent,
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
  protected readonly reportTitle = this.facade.title;
  protected readonly selectedCategoryName = this.facade.selectedCategoryName;
  protected readonly tableRows = this.facade.tableRows;
  protected readonly canViewLedgerCategoryReport = this.facade.canViewLedgerCategoryReport;
  protected readonly canOpenLedgerReport = this.facade.canOpenLedgerReport;
  protected readonly canOpenJournal = this.facade.canOpenJournal;
  protected readonly hasError = this.facade.hasError;
  protected readonly hasCategorySelected = this.facade.hasCategorySelected;
  protected readonly showSelectCategoryNotice = this.facade.showSelectCategoryNotice;
  protected readonly autocompleteCategories = this.facade.autocompleteCategories;
  protected readonly draftCategoryId = this.facade.draftCategoryId;
  protected readonly categoryOptionValue = this.facade.categoryOptionValue;
  protected readonly categoryOptionLabel = this.facade.categoryOptionLabel;
  protected readonly categoryTrackBy = this.facade.categoryTrackBy;

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
    { id: 'sourcetype', label: 'Type', width: '9.5rem' },
    { id: 'ledgerName', label: 'Ledger', width: '12rem' },
    { id: 'oppositeLedgers', label: 'Against', width: '12rem' },
    { id: 'debit', label: 'Debit', align: 'end', headerAlign: 'end', width: '7.5rem' },
    { id: 'credit', label: 'Credit', align: 'end', headerAlign: 'end', width: '7.5rem' },
    { id: 'balance', label: 'Balance', align: 'end', headerAlign: 'end', width: '8.5rem' },
    { id: 'description', label: 'Description', truncate: true },
  ];

  protected onRefresh(): void {
    this.facade.onRefresh();
  }

  protected onDraftCategoryChange(ledgercategoryid: string | null): void {
    this.facade.onDraftCategoryChange(ledgercategoryid);
  }

  protected onCategoryQueryChange(query: string): void {
    this.facade.onCategoryQueryChange(query);
  }

  protected onApplyCategorySelection(event: SubmitEvent): void {
    event.preventDefault();
    this.facade.applyCategorySelection();
  }

  protected formatDisplayDate(value: string | null | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected sourceTypeLabel(value: LedgerCategoryReportRow['sourcetype']): string {
    return journalSourceTypeLabel(value);
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
