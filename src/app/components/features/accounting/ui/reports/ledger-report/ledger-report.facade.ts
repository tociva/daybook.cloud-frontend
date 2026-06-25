import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import type { TngDateRangePickerSelectionInput } from '@tailng-ui/components';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';
import type {
  LedgerReport,
  LedgerReportLedger,
  LedgerReportRow,
  LedgerReportSummary,
} from '../../../data/ledger-report/ledger-report.model';
import { LedgerReportService } from '../../../data/ledger-report/ledger-report.service';
import { hasAccountingReportPermission } from '../../../shared/accounting-report-permissions';
import {
  DEFAULT_REPORT_DATE_OPERATOR,
  REPORT_DATE_OPERATOR_OPTIONS,
  REPORT_DATE_OPERATOR_QUERY_PARAM,
  type ReportDateOperator,
  buildReportDateQuery,
  buildReportDateRouterQueryFromSelection,
  buildReportDateRouterQueryFromPicker,
  parseIsoDateToDate,
  parseReportDateOperator,
  reportDatePickerValueFromQuery,
  seedMissingReportDateQuery,
} from '../shared/report-date-query.util';

const permissionError = 'You do not have permission to view the ledger report.';

const ledgerReportPath = (ledgerid: string): readonly string[] => [
  '/app/accounting/reports/ledger',
  ledgerid,
];

const ledgerReportPathRoot = (): readonly string[] => ['/app/accounting/reports/ledger'];

const journalPath = (journalid: string): readonly string[] => [
  '/app/accounting/journal',
  journalid,
];

export const emptyLedgerReportSummary = (): LedgerReportSummary => ({
  openingDebit: 0,
  openingCredit: 0,
  runningDebit: 0,
  runningCredit: 0,
  closingDebit: 0,
  closingCredit: 0,
});

@Injectable()
export class LedgerReportFacade {
  private readonly ledgerReportService = inject(LedgerReportService);
  private readonly ledgerStore = inject(LedgerStore);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly permissionsStore = inject(PermissionsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  private lastBootstrapKey: string | null = null;
  private lastRouteLedgerId: string | null | undefined = undefined;
  private ledgerCatalogPromise: Promise<void> | null = null;
  private loadToken = 0;

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly title = signal('');
  readonly generatedAt = signal('');
  readonly summary = signal<LedgerReportSummary>(emptyLedgerReportSummary());
  readonly tableRows = signal<readonly LedgerReportRow[]>([]);
  readonly selectedLedgerId = signal<string | null>(null);
  readonly ledgerQuery = signal('');
  readonly pickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);
  readonly draftLedgerId = signal<string | null>(null);
  readonly draftDateOperator = signal<ReportDateOperator>(DEFAULT_REPORT_DATE_OPERATOR);
  readonly draftPickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);
  readonly draftSingleDate = signal<Date | null>(null);

  private readonly selectedLedgerMeta = signal<LedgerReportLedger | null>(null);

  readonly canViewLedgerReport = computed(() =>
    hasAccountingReportPermission(this.permissionsStore.all(), 'ledgerReport'),
  );

  readonly catalogError = computed(() => this.ledgerStore.error());
  readonly displayError = computed(() => this.error() ?? this.catalogError());
  readonly hasError = computed(() => this.displayError() !== null);
  readonly hasLedgerSelected = computed(() => !!this.selectedLedgerId());
  readonly selectedLedgerName = computed(() => {
    const ledgerid = this.selectedLedgerId();
    if (!ledgerid) return '';

    const meta = this.selectedLedgerMeta();
    if (meta?.ledgerid === ledgerid && meta.ledgerName) {
      return meta.ledgerName;
    }

    const fromCatalog = this.ledgerStore.catalog().find((ledger) => ledger.id === ledgerid);
    return fromCatalog?.name ?? '';
  });
  readonly showSelectLedgerNotice = computed(
    () => !this.hasLedgerSelected() && !this.isLoading() && !this.hasError(),
  );
  readonly activeFilterCount = computed<number | null>(() => {
    let count = 0;
    if (this.selectedLedgerId()) count += 1;
    if (this.hasDateRange(this.pickerValue())) count += 1;
    return count || null;
  });

  readonly autocompleteLedgers = computed(() => {
    const query = this.ledgerQuery().trim().toLowerCase();
    const items = this.ledgerStore.catalog();
    const filtered = !query
      ? items
      : items.filter((ledger) => (ledger.name ?? '').toLowerCase().includes(query));
    return this.mergeSelectedLedgerOption(filtered);
  });

  readonly ledgerOptionValue = (ledger: Ledger): string => ledger.id ?? '';
  readonly ledgerOptionLabel = (ledger: Ledger): string => ledger.name ?? '';
  readonly ledgerTrackBy = (_index: number, ledger: Ledger): string => ledger.id ?? '';
  readonly dateOperatorOptions = REPORT_DATE_OPERATOR_OPTIONS;
  readonly dateOperatorOptionLabel = (option: (typeof REPORT_DATE_OPERATOR_OPTIONS)[number]) =>
    option.label;
  readonly dateOperatorOptionValue = (option: (typeof REPORT_DATE_OPERATOR_OPTIONS)[number]) =>
    option.value;
  readonly dateOperatorTrackBy = (
    _index: number,
    option: (typeof REPORT_DATE_OPERATOR_OPTIONS)[number],
  ) => option.value;
  readonly isDraftDateBetween = computed(
    () => this.draftDateOperator() === DEFAULT_REPORT_DATE_OPERATOR,
  );

  constructor() {
    effect(() => {
      const params = this.queryParams();
      const routeParams = this.routeParams();
      const range = this.fiscalYearDateRange.range();
      const ledgerid = routeParams.get('ledgerid');
      const previousRouteLedgerId = this.lastRouteLedgerId;
      this.lastRouteLedgerId = ledgerid;

      this.selectedLedgerId.set(ledgerid);

      const start = params.get('start');
      const end = params.get('end');
      const dateOperator = parseReportDateOperator(params.get(REPORT_DATE_OPERATOR_QUERY_PARAM));

      if (!range) return;

      const seededQuery = seedMissingReportDateQuery(start, end, range, dateOperator);
      if (seededQuery) {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: seededQuery,
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
        return;
      }

      this.pickerValue.set(reportDatePickerValueFromQuery(dateOperator, start, end));

      if (!ledgerid) {
        this.lastBootstrapKey = null;
        this.nextLoadToken();
        if (previousRouteLedgerId) {
          this.draftLedgerId.set(null);
          this.ledgerQuery.set('');
        }
        this.clearReport();
        void this.loadLedgerCatalogOnly();
        return;
      }

      if (!this.canViewLedgerReport()) {
        this.lastBootstrapKey = null;
        this.nextLoadToken();
        this.error.set(permissionError);
        this.clearReportData();
        return;
      }

      const bootstrapKey = `${ledgerid}|${dateOperator}|${start}|${end}`;
      if (this.lastBootstrapKey === bootstrapKey) return;
      this.lastBootstrapKey = bootstrapKey;

      const token = this.nextLoadToken();
      void this.bootstrapLedgerReport(token, ledgerid, start, end, dateOperator);
    });
  }

  openFilterPopover(): void {
    const operator = this.currentDateOperatorFromQuery();

    this.draftLedgerId.set(this.routeParams().get('ledgerid'));
    this.draftDateOperator.set(operator);
    this.draftPickerValue.set(this.currentPickerValueFromQuery(operator));
    this.draftSingleDate.set(this.currentSingleDateFromQuery(operator));
  }

  onDraftDateOperatorChange(operator: ReportDateOperator | string | null): void {
    const nextOperator = parseReportDateOperator(operator);
    const currentOperator = this.draftDateOperator();
    if (nextOperator === currentOperator) return;

    this.draftDateOperator.set(nextOperator);

    if (nextOperator === DEFAULT_REPORT_DATE_OPERATOR) {
      const singleDate = this.draftSingleDate();
      if (singleDate) {
        this.draftPickerValue.set({ start: singleDate, end: singleDate });
      }
      return;
    }

    this.draftSingleDate.set(this.singleDateFromDraftPicker(nextOperator));
  }

  onDraftDateRangeChange(value: TngDateRangePickerSelectionInput<Date>): void {
    this.draftPickerValue.set(value);
  }

  onDraftSingleDateChange(value: Date | null): void {
    this.draftSingleDate.set(value);
  }

  onDraftLedgerChange(ledgerid: string | null): void {
    this.draftLedgerId.set(ledgerid);
  }

  applyFilters(): void {
    const queryParams =
      buildReportDateRouterQueryFromSelection(
        this.draftDateOperator(),
        this.draftPickerValue(),
        this.draftSingleDate(),
        (value) => this.fiscalYearDateRange.toIsoDate(value),
      ) ?? this.defaultReportDateRouterQuery();
    const ledgerid = this.draftLedgerId();

    void this.router.navigate(ledgerid ? ledgerReportPath(ledgerid) : ledgerReportPathRoot(), {
      queryParams,
    });
  }

  private currentReportDateRouterQuery(): {
    dateOperator?: ReportDateOperator;
    end?: string | null;
    start?: string | null;
  } {
    const params = this.queryParams();
    const operator = parseReportDateOperator(params.get(REPORT_DATE_OPERATOR_QUERY_PARAM));

    return (
      buildReportDateRouterQueryFromSelection(
        operator,
        reportDatePickerValueFromQuery(operator, params.get('start'), params.get('end')),
        this.currentSingleDateFromQuery(operator),
        (value) => this.fiscalYearDateRange.toIsoDate(value),
      ) ??
      buildReportDateRouterQueryFromPicker(this.pickerValue(), (value) =>
        this.fiscalYearDateRange.toIsoDate(value),
      ) ??
      this.defaultReportDateRouterQuery()
    );
  }

  clearFilters(): void {
    this.draftLedgerId.set(null);
    this.draftDateOperator.set(DEFAULT_REPORT_DATE_OPERATOR);
    this.draftPickerValue.set(this.fiscalYearPickerValue());
    this.draftSingleDate.set(this.fiscalYearSingleDate());
  }

  onLedgerQueryChange(query: string): void {
    this.ledgerQuery.set(query);
  }

  applyLedgerSelection(): void {
    const ledgerid = this.draftLedgerId();
    if (!ledgerid) return;

    void this.router.navigate(ledgerReportPath(ledgerid), {
      queryParams: this.currentReportDateRouterQuery(),
    });
  }

  onRefresh(): void {
    const ledgerid = this.selectedLedgerId();
    if (!ledgerid) return;

    if (!this.canViewLedgerReport()) {
      this.nextLoadToken();
      this.error.set(permissionError);
      this.clearReportData();
      return;
    }

    const token = this.nextLoadToken();
    const params = this.queryParams();
    void this.loadReport(
      token,
      ledgerid,
      params.get('start'),
      params.get('end'),
      parseReportDateOperator(params.get(REPORT_DATE_OPERATOR_QUERY_PARAM)),
    );
  }

  viewJournal(journalid: string): void {
    void this.router.navigate(journalPath(journalid), {
      queryParams: { burl: this.router.url },
    });
  }

  openOppositeLedger(ledgerid: string): void {
    void this.router.navigate(ledgerReportPath(ledgerid), {
      queryParams: this.currentReportDateRouterQuery(),
    });
  }

  private currentDateOperatorFromQuery(): ReportDateOperator {
    return parseReportDateOperator(this.queryParams().get(REPORT_DATE_OPERATOR_QUERY_PARAM));
  }

  private currentPickerValueFromQuery(
    operator: ReportDateOperator,
  ): TngDateRangePickerSelectionInput<Date> {
    const params = this.queryParams();
    const range = this.fiscalYearDateRange.range();
    const start = params.get('start') ?? range?.startdate ?? null;
    const end = params.get('end') ?? range?.enddate ?? null;

    return reportDatePickerValueFromQuery(operator, start, end);
  }

  private currentSingleDateFromQuery(operator: ReportDateOperator): Date | null {
    const params = this.queryParams();
    const range = this.fiscalYearDateRange.range();
    const start = params.get('start');
    const end = params.get('end');

    if (operator === 'le') {
      return parseIsoDateToDate(end ?? start ?? range?.enddate);
    }

    return parseIsoDateToDate(start ?? end ?? range?.startdate);
  }

  private fiscalYearPickerValue(): TngDateRangePickerSelectionInput<Date> {
    const range = this.fiscalYearDateRange.range();
    if (!range) return null;

    return {
      start: parseIsoDateToDate(range.startdate),
      end: parseIsoDateToDate(range.enddate),
    };
  }

  private fiscalYearSingleDate(): Date | null {
    const range = this.fiscalYearDateRange.range();
    return parseIsoDateToDate(range?.startdate);
  }

  private defaultReportDateRouterQuery(): { end: string | null; start: string | null } {
    const range = this.fiscalYearDateRange.range();
    return {
      start: range?.startdate ?? null,
      end: range?.enddate ?? null,
    };
  }

  private singleDateFromDraftPicker(operator: ReportDateOperator): Date | null {
    const value = this.draftPickerValue();
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      const start = this.resolveDateInput(value.start);
      const end = this.resolveDateInput(value.end);

      if (operator === 'le') {
        return end ?? start ?? this.fiscalYearSingleDate();
      }

      return start ?? end ?? this.fiscalYearSingleDate();
    }

    return this.fiscalYearSingleDate();
  }

  private resolveDateInput(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'string') return parseIsoDateToDate(value);

    return null;
  }

  private hasDateRange(value: TngDateRangePickerSelectionInput<Date>): boolean {
    return !!(
      value &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      (value.start || value.end)
    );
  }

  private clearReport(): void {
    this.error.set(null);
    this.clearReportData();
  }

  private clearReportData(): void {
    this.selectedLedgerMeta.set(null);
    this.title.set('');
    this.generatedAt.set('');
    this.summary.set(emptyLedgerReportSummary());
    this.tableRows.set([]);
  }

  private mergeSelectedLedgerOption(options: readonly Ledger[]): readonly Ledger[] {
    const map = new Map<string, Ledger>();
    for (const ledger of options) {
      if (ledger.id) map.set(ledger.id, ledger);
    }

    for (const ledgerid of [this.selectedLedgerId(), this.draftLedgerId()]) {
      if (!ledgerid || map.has(ledgerid)) continue;

      const fromCatalog = this.ledgerStore.catalog().find((ledger) => ledger.id === ledgerid);
      if (fromCatalog) {
        map.set(ledgerid, fromCatalog);
        continue;
      }

      const meta = this.selectedLedgerMeta();
      if (meta?.ledgerid === ledgerid && meta.ledgerName) {
        map.set(ledgerid, {
          id: meta.ledgerid,
          name: meta.ledgerName,
          categoryid: '',
        });
      }
    }

    return [...map.values()];
  }

  private async bootstrapLedgerReport(
    token: number,
    ledgerid: string,
    start: string | null,
    end: string | null,
    operator: ReportDateOperator,
  ): Promise<void> {
    try {
      await this.ensureLedgerCatalogLoaded();
      if (!this.isActiveLoad(token)) return;
      await this.loadReport(token, ledgerid, start, end, operator);
    } catch (err) {
      if (!this.isActiveLoad(token)) return;
      this.error.set(getApiErrorMessage(err, 'Failed to load ledger catalog.'));
      this.clearReportData();
      this.isLoading.set(false);
    }
  }

  private async ensureLedgerCatalogLoaded(): Promise<void> {
    if (!this.ledgerCatalogPromise) {
      this.ledgerCatalogPromise = this.fetchLedgerCatalog().finally(() => {
        this.ledgerCatalogPromise = null;
      });
    }

    await this.ledgerCatalogPromise;
  }

  private async loadLedgerCatalogOnly(): Promise<void> {
    try {
      await this.ensureLedgerCatalogLoaded();
    } catch (err) {
      this.error.set(getApiErrorMessage(err, 'Failed to load ledger catalog.'));
    }
  }

  private async fetchLedgerCatalog(): Promise<void> {
    const loaded = await this.ledgerStore.ensureLedgerCatalogLoaded(false);
    if (!loaded) {
      throw new Error(this.ledgerStore.error() ?? 'Failed to load ledger catalog.');
    }
  }

  private async loadReport(
    token: number,
    ledgerid: string,
    start: string | null,
    end: string | null,
    operator: ReportDateOperator,
  ): Promise<void> {
    if (!this.isActiveLoad(token)) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const report = await this.ledgerReportService.getLedgerReport(
        ledgerid,
        buildReportDateQuery(start, end, operator),
      );
      if (!this.isActiveLoad(token)) return;

      this.applyReport(report);
      this.error.set(null);
    } catch (err) {
      if (!this.isActiveLoad(token)) return;

      this.error.set(getApiErrorMessage(err, 'Failed to load ledger report.'));
      this.clearReportData();
    } finally {
      if (this.isActiveLoad(token)) {
        this.isLoading.set(false);
      }
    }
  }

  private applyReport(report: LedgerReport): void {
    this.selectedLedgerMeta.set(report.ledger);
    this.title.set(report.title);
    this.generatedAt.set(report.generatedAt);
    this.summary.set(report.summary);
    this.tableRows.set(report.data);
  }

  private nextLoadToken(): number {
    this.loadToken += 1;
    return this.loadToken;
  }

  private isActiveLoad(token: number): boolean {
    return token === this.loadToken;
  }
}
