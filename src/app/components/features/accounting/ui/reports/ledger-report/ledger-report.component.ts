import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  TngAutocompleteComponent,
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
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import {
  FiscalYearDateRangePickerComponent,
  FiscalYearDateRangeService,
} from '../../../../../../shared/fiscal-year-date-range-picker';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import { LedgerReportService } from '../../../data/ledger-report/ledger-report.service';
import type {
  LedgerReport,
  LedgerReportLedger,
  LedgerReportQuery,
  LedgerReportRow,
  LedgerReportSummary,
} from '../../../data/ledger-report/ledger-report.model';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';
import { hasAccountingReportPermission } from '../../../shared/accounting-report-permissions';
import { createReportAmountFormatter, formatNetBalance } from '../../../shared/report-amount.util';

const reportCatalogPageSize = 1000;

const emptySummary = (): LedgerReportSummary => ({
  openingDebit: 0,
  openingCredit: 0,
  runningDebit: 0,
  runningCredit: 0,
  closingDebit: 0,
  closingCredit: 0,
});

@Component({
  selector: 'app-ledger-report',
  standalone: true,
  imports: [
    CommonModule,
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    TngIcon,
    TngTable,
    TngTableCellTpl,
    TngAutocompleteComponent,
    FiscalYearDateRangePickerComponent,
  ],
  templateUrl: './ledger-report.component.html',
  styleUrl: './ledger-report.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LedgerReportComponent {
  private readonly ledgerReportService = inject(LedgerReportService);
  private readonly ledgerStore = inject(LedgerStore);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly dateManagement = inject(DateManagementService);
  private readonly permissionsStore = inject(PermissionsStore);
  private readonly userSessionStore = inject(UserSessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  /** Prevents the route effect from re-fetching the same report in a loop. */
  private lastBootstrapKey: string | null = null;
  private ledgersCatalogPromise: Promise<void> | null = null;

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly generatedAt = signal('');
  protected readonly summary = signal<LedgerReportSummary>(emptySummary());
  protected readonly tableRows = signal<readonly LedgerReportRow[]>([]);
  protected readonly selectedLedgerId = signal<string | null>(null);
  /** Name/id from the latest report response — used until the ledger catalog is ready. */
  private readonly selectedLedgerMeta = signal<LedgerReportLedger | null>(null);
  protected readonly ledgerQuery = signal('');
  protected readonly pickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);
  protected readonly pendingPickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);

  protected readonly canViewLedgerReport = computed(() =>
    hasAccountingReportPermission(this.permissionsStore.all(), 'ledgerReport'),
  );

  protected readonly currencyMinorUnit = computed(() => {
    const currency = this.userSessionStore.session()?.fiscalyear?.currency;
    const minor = currency?.minorunit;
    return typeof minor === 'number' && minor >= 0 ? minor : 2;
  });

  protected readonly formatAmount = computed(() =>
    createReportAmountFormatter(this.currencyMinorUnit()),
  );

  protected readonly hasError = computed(() => this.error() !== null);
  protected readonly hasLedgerSelected = computed(() => !!this.selectedLedgerId());
  protected readonly showSelectLedgerNotice = computed(
    () => !this.hasLedgerSelected() && !this.isLoading() && !this.hasError(),
  );

  protected readonly openingBalanceLabel = computed(() =>
    formatNetBalance(
      this.summary().openingDebit,
      this.summary().openingCredit,
      this.formatAmount(),
    ),
  );

  protected readonly runningBalanceLabel = computed(() =>
    formatNetBalance(
      this.summary().runningDebit,
      this.summary().runningCredit,
      this.formatAmount(),
    ),
  );

  protected readonly closingBalanceLabel = computed(() =>
    formatNetBalance(
      this.summary().closingDebit,
      this.summary().closingCredit,
      this.formatAmount(),
    ),
  );

  protected readonly autocompleteLedgers = computed(() => {
    const query = this.ledgerQuery().trim().toLowerCase();
    const items = this.ledgerStore.items();
    const filtered = !query
      ? items
      : items.filter((ledger) => (ledger.name ?? '').toLowerCase().includes(query));
    return this.mergeSelectedLedgerOption(filtered);
  });

  protected readonly columns: readonly TngTableColumn<LedgerReportRow>[] = [
    { id: 'date', label: 'Date', width: '7.5rem' },
    { id: 'journalNumber', label: 'Journal #', width: '11rem' },
    { id: 'oppositeLedgers', label: 'Against', width: '14rem' },
    { id: 'debit', label: 'Debit', align: 'end', headerAlign: 'end', width: '8rem' },
    { id: 'credit', label: 'Credit', align: 'end', headerAlign: 'end', width: '8rem' },
    { id: 'balance', label: 'Balance', align: 'end', headerAlign: 'end', width: '9rem' },
    { id: 'description', label: 'Description', truncate: true },
  ];

  protected readonly ledgerOptionValue = (ledger: Ledger): string => ledger.id ?? '';
  protected readonly ledgerOptionLabel = (ledger: Ledger): string => ledger.name ?? '';
  protected readonly ledgerTrackBy = (_index: number, ledger: Ledger): string => ledger.id ?? '';

  constructor() {
    effect(() => {
      const params = this.queryParams();
      const routeParams = this.routeParams();
      const range = this.fiscalYearDateRange.range();
      const ledgerid = routeParams.get('ledgerid');

      this.selectedLedgerId.set(ledgerid);

      const start = params.get('start');
      const end = params.get('end');

      if (!range) return;

      if (!start || !end) {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            start: start ?? range.startdate,
            end: end ?? range.enddate,
          },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
        return;
      }

      this.pickerValue.set({
        start: this.parseIsoToDate(start),
        end: this.parseIsoToDate(end),
      });

      if (!ledgerid) {
        this.lastBootstrapKey = null;
        this.clearReport();
        void this.ensureLedgersCatalogLoaded();
        return;
      }

      if (!this.canViewLedgerReport()) {
        this.error.set('You do not have permission to view the ledger report.');
        this.clearReportData();
        return;
      }

      const bootstrapKey = `${ledgerid}|${start}|${end}`;
      if (this.lastBootstrapKey === bootstrapKey) return;
      this.lastBootstrapKey = bootstrapKey;

      void this.bootstrapLedgerReport(ledgerid, start, end);
    });
  }

  protected onDateRangeChange(value: { start: Date | null; end: Date | null } | null): void {
    this.pendingPickerValue.set(value);
  }

  protected onPickerClosed(): void {
    const pending = this.pendingPickerValue();
    if (!pending || typeof pending !== 'object' || pending instanceof Date) return;
    const { start, end } = pending as { start: Date | null; end: Date | null };
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        start: start ? this.fiscalYearDateRange.toIsoDate(start) : null,
        end: end ? this.fiscalYearDateRange.toIsoDate(end) : null,
      },
      queryParamsHandling: 'merge',
    });
  }

  protected onLedgerQueryChange(query: string): void {
    this.ledgerQuery.set(query);
  }

  protected onLedgerChange(ledgerid: string | null): void {
    if (!ledgerid || ledgerid === this.routeParams().get('ledgerid')) return;
    const params = this.queryParams();
    void this.router.navigate(['/app/accounting/reports/ledger', ledgerid], {
      queryParams: {
        start: params.get('start'),
        end: params.get('end'),
      },
    });
  }

  protected onRefresh(): void {
    const ledgerid = this.selectedLedgerId();
    if (!ledgerid) return;
    this.lastBootstrapKey = null;
    const params = this.queryParams();
    void this.loadReport(
      ledgerid,
      params.get('start') ?? undefined,
      params.get('end') ?? undefined,
    );
  }

  protected formatDisplayDate(value: string | null | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected readonly formatGeneratedAt = (value: string | null | undefined): string =>
    this.dateManagement.formatDisplayDateTime(value, '—');

  protected formatRowBalance(row: LedgerReportRow): string {
    return formatNetBalance(row.balanceDebit, row.balanceCredit, this.formatAmount());
  }

  protected formatSummaryDebitCredit(debit: number, credit: number): string {
    const dr = this.formatAmount()(debit);
    const cr = this.formatAmount()(credit);
    if (dr && cr) return `${dr} Dr / ${cr} Cr`;
    if (dr) return `${dr} Dr`;
    if (cr) return `${cr} Cr`;
    return '—';
  }

  protected viewJournal(journalid: string): void {
    void this.router.navigate(['/app/accounting/journal', journalid]);
  }

  protected openOppositeLedger(ledgerid: string): void {
    const params = this.queryParams();
    void this.router.navigate(['/app/accounting/reports/ledger', ledgerid], {
      queryParams: {
        start: params.get('start'),
        end: params.get('end'),
      },
    });
  }

  private clearReport(): void {
    this.error.set(null);
    this.clearReportData();
  }

  private clearReportData(): void {
    this.selectedLedgerMeta.set(null);
    this.generatedAt.set('');
    this.summary.set(emptySummary());
    this.tableRows.set([]);
  }

  private mergeSelectedLedgerOption(options: readonly Ledger[]): readonly Ledger[] {
    const ledgerid = this.selectedLedgerId();
    if (!ledgerid) return options;

    const map = new Map<string, Ledger>();
    for (const ledger of options) {
      if (ledger.id) map.set(ledger.id, ledger);
    }
    if (map.has(ledgerid)) return [...map.values()];

    const fromCatalog = this.ledgerStore.items().find((ledger) => ledger.id === ledgerid);
    if (fromCatalog) {
      map.set(ledgerid, fromCatalog);
      return [...map.values()];
    }

    const meta = this.selectedLedgerMeta();
    if (meta?.ledgerid === ledgerid && meta.ledgerName) {
      map.set(ledgerid, {
        id: meta.ledgerid,
        name: meta.ledgerName,
        categoryid: '',
      });
    }

    return [...map.values()];
  }

  private async bootstrapLedgerReport(
    ledgerid: string,
    start: string,
    end: string,
  ): Promise<void> {
    await this.ensureLedgersCatalogLoaded();
    await this.loadReport(ledgerid, start, end);
  }

  private async ensureLedgersCatalogLoaded(): Promise<void> {
    if (!this.ledgersCatalogPromise) {
      this.ledgersCatalogPromise = this.fetchLedgersCatalog();
    }
    await this.ledgersCatalogPromise;
  }

  private async fetchLedgersCatalog(): Promise<void> {
    const query = {
      limit: reportCatalogPageSize,
      offset: 0,
    };

    await this.ledgerStore.loadLedgers(query);
    const count = this.ledgerStore.count();
    if (count > this.ledgerStore.items().length) {
      await this.ledgerStore.loadLedgers({ ...query, limit: count });
    }
  }

  private async loadReport(ledgerid: string, start?: string, end?: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const query: LedgerReportQuery = {};
      if (start) query.start = start;
      if (end) query.end = end;

      const report = await this.ledgerReportService.getLedgerReport(ledgerid, query);
      this.applyReport(report);
      this.error.set(null);
    } catch (err) {
      this.error.set(getApiErrorMessage(err, 'Failed to load ledger report.'));
      this.clearReportData();
    } finally {
      this.isLoading.set(false);
    }
  }

  private applyReport(report: LedgerReport): void {
    this.selectedLedgerMeta.set(report.ledger);
    this.generatedAt.set(report.generatedAt);
    this.summary.set(report.summary);

    this.tableRows.set(report.data);
  }

  private parseIsoToDate(iso: string): Date | null {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }
}
