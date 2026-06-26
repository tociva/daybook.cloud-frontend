import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import type { LedgerReportRow } from '../../../data/ledger-report/ledger-report.model';
import {
  buildAccountingReportSummaryMetrics,
  type AccountingReportSummaryMetric,
} from '../../../shared/accounting-report-summary.util';
import { createReportAmountFormatter, formatNetBalance } from '../../../shared/report-amount.util';
import { LedgerReportFilterPopoverComponent } from './ledger-report-filter-popover/ledger-report-filter-popover.component';
import { LedgerReportFacade } from './ledger-report.facade';

const COLLAPSED_OPPOSITE_LEDGER_LIMIT = 1;

@Component({
  selector: 'app-ledger-report',
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
    LedgerReportFilterPopoverComponent,
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
  protected readonly reportTitle = this.facade.title;
  protected readonly selectedLedgerName = this.facade.selectedLedgerName;
  protected readonly tableRows = this.facade.tableRows;
  protected readonly canViewLedgerReport = this.facade.canViewLedgerReport;
  protected readonly hasError = this.facade.hasError;
  protected readonly hasLedgerSelected = this.facade.hasLedgerSelected;
  protected readonly showSelectLedgerNotice = this.facade.showSelectLedgerNotice;
  protected readonly autocompleteLedgers = this.facade.autocompleteLedgers;
  protected readonly draftLedgerId = this.facade.draftLedgerId;
  protected readonly ledgerOptionValue = this.facade.ledgerOptionValue;
  protected readonly ledgerOptionLabel = this.facade.ledgerOptionLabel;
  protected readonly ledgerTrackBy = this.facade.ledgerTrackBy;
  private readonly expandedOppositeLedgerRows = signal<ReadonlySet<string>>(new Set());

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
    { id: 'sourcetype', label: 'Type', width: '9.5rem' },
    { id: 'oppositeLedgers', label: 'Against', width: '14rem' },
    { id: 'debit', label: 'Debit', align: 'end', headerAlign: 'end', width: '8rem' },
    { id: 'credit', label: 'Credit', align: 'end', headerAlign: 'end', width: '8rem' },
    { id: 'balance', label: 'Balance', align: 'end', headerAlign: 'end', width: '9rem' },
    { id: 'description', label: 'Description', truncate: true },
  ];

  protected onRefresh(): void {
    this.facade.onRefresh();
  }

  protected onDraftLedgerChange(ledgerid: string | null): void {
    this.facade.onDraftLedgerChange(ledgerid);
  }

  protected onLedgerQueryChange(query: string): void {
    this.facade.onLedgerQueryChange(query);
  }

  protected onApplyLedgerSelection(event: SubmitEvent): void {
    event.preventDefault();
    this.facade.applyLedgerSelection();
  }

  protected formatDisplayDate(value: string | null | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected sourceTypeLabel(value: LedgerReportRow['sourcetype']): string {
    return journalSourceTypeLabel(value);
  }

  protected readonly formatGeneratedAt = (value: string | null | undefined): string =>
    this.dateManagement.formatDisplayDateTime(value, '—');

  protected formatRowBalance(row: LedgerReportRow): string {
    return formatNetBalance(row.balanceDebit, row.balanceCredit, this.formatAmount());
  }

  protected visibleOppositeLedgers(row: LedgerReportRow): LedgerReportRow['oppositeLedgers'] {
    if (this.isOppositeLedgerRowExpanded(row)) return row.oppositeLedgers;
    return row.oppositeLedgers.slice(0, COLLAPSED_OPPOSITE_LEDGER_LIMIT);
  }

  protected hiddenOppositeLedgerCount(row: LedgerReportRow): number {
    return Math.max(row.oppositeLedgers.length - COLLAPSED_OPPOSITE_LEDGER_LIMIT, 0);
  }

  protected showOppositeLedgerMore(row: LedgerReportRow): boolean {
    return this.hiddenOppositeLedgerCount(row) > 0 && !this.isOppositeLedgerRowExpanded(row);
  }

  protected showOppositeLedgerLess(row: LedgerReportRow): boolean {
    return this.hiddenOppositeLedgerCount(row) > 0 && this.isOppositeLedgerRowExpanded(row);
  }

  protected expandOppositeLedgers(row: LedgerReportRow): void {
    const key = this.oppositeLedgerRowKey(row);
    this.expandedOppositeLedgerRows.update((current) => new Set([...current, key]));
  }

  protected collapseOppositeLedgers(row: LedgerReportRow): void {
    const key = this.oppositeLedgerRowKey(row);
    this.expandedOppositeLedgerRows.update((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  protected viewJournal(journalid: string): void {
    this.facade.viewJournal(journalid);
  }

  protected openOppositeLedger(ledgerid: string): void {
    this.facade.openOppositeLedger(ledgerid);
  }

  private isOppositeLedgerRowExpanded(row: LedgerReportRow): boolean {
    return this.expandedOppositeLedgerRows().has(this.oppositeLedgerRowKey(row));
  }

  private oppositeLedgerRowKey(row: LedgerReportRow): string {
    return `${row.journalid}:${row.date}:${row.order}`;
  }
}
