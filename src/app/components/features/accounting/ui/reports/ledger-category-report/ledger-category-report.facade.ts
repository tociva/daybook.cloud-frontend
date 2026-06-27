import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import type { TngDateRangePickerSelectionInput } from '@tailng-ui/components';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import { PERMISSION } from '../../../../../../core/permissions/permission-requirements';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { LedgerCategoryStore } from '../../../data/ledger-category';
import type { LedgerCategory } from '../../../data/ledger-category';
import type {
  LedgerCategoryReport,
  LedgerCategoryReportCategory,
  LedgerCategoryReportRow,
  LedgerCategoryReportSummary,
} from '../../../data/ledger-category-report/ledger-category-report.model';
import { LedgerCategoryReportService } from '../../../data/ledger-category-report/ledger-category-report.service';
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

const permissionError = 'You do not have permission to view the ledger category report.';

const ledgerCategoryReportPath = (ledgercategoryid: string): readonly string[] => [
  '/app/accounting/reports/ledger-category',
  ledgercategoryid,
];

const ledgerCategoryReportPathRoot = (): readonly string[] => [
  '/app/accounting/reports/ledger-category',
];

const ledgerReportPath = (ledgerid: string): readonly string[] => [
  '/app/accounting/reports/ledger',
  ledgerid,
];

const journalPath = (journalid: string): readonly string[] => [
  '/app/accounting/journal',
  journalid,
];

export const emptyLedgerCategoryReportSummary = (): LedgerCategoryReportSummary => ({
  openingDebit: 0,
  openingCredit: 0,
  runningDebit: 0,
  runningCredit: 0,
  closingDebit: 0,
  closingCredit: 0,
});

@Injectable()
export class LedgerCategoryReportFacade {
  private readonly ledgerCategoryReportService = inject(LedgerCategoryReportService);
  private readonly ledgerCategoryStore = inject(LedgerCategoryStore);
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
  private lastRouteCategoryId: string | null | undefined = undefined;
  private categoryCatalogPromise: Promise<void> | null = null;
  private loadToken = 0;

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly title = signal('');
  readonly generatedAt = signal('');
  readonly summary = signal<LedgerCategoryReportSummary>(emptyLedgerCategoryReportSummary());
  readonly tableRows = signal<readonly LedgerCategoryReportRow[]>([]);
  readonly selectedCategoryId = signal<string | null>(null);
  readonly categoryQuery = signal('');
  readonly pickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);
  readonly draftCategoryId = signal<string | null>(null);
  readonly draftDateOperator = signal<ReportDateOperator>(DEFAULT_REPORT_DATE_OPERATOR);
  readonly draftPickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);
  readonly draftSingleDate = signal<Date | null>(null);

  private readonly selectedCategoryMeta = signal<LedgerCategoryReportCategory | null>(null);

  readonly canViewLedgerCategoryReport = computed(() =>
    hasAccountingReportPermission(this.permissionsStore, 'ledgerCategoryReport'),
  );

  readonly canOpenLedgerReport = computed(() =>
    hasAccountingReportPermission(this.permissionsStore, 'ledgerReport'),
  );
  readonly canOpenJournal = computed(() =>
    this.permissionsStore.can(PERMISSION.fiscalYear.journal.view),
  );

  readonly catalogError = computed(() => this.ledgerCategoryStore.error());
  readonly displayError = computed(() => this.error() ?? this.catalogError());
  readonly hasError = computed(() => this.displayError() !== null);
  readonly hasCategorySelected = computed(() => !!this.selectedCategoryId());
  readonly selectedCategoryName = computed(() => {
    const ledgercategoryid = this.selectedCategoryId();
    if (!ledgercategoryid) return '';

    const meta = this.selectedCategoryMeta();
    if (meta?.ledgercategoryid === ledgercategoryid && meta.ledgerCategoryName) {
      return meta.ledgerCategoryName;
    }

    const fromCatalog = this.ledgerCategoryStore
      .catalog()
      .find((category) => category.id === ledgercategoryid);
    return fromCatalog?.name ?? '';
  });
  readonly showSelectCategoryNotice = computed(
    () => !this.hasCategorySelected() && !this.isLoading() && !this.hasError(),
  );
  readonly activeFilterCount = computed<number | null>(() => {
    let count = 0;
    if (this.selectedCategoryId()) count += 1;
    if (this.hasDateRange(this.pickerValue())) count += 1;
    return count || null;
  });

  readonly autocompleteCategories = computed(() => {
    const query = this.categoryQuery().trim().toLowerCase();
    const items = this.ledgerCategoryStore.catalog();
    const filtered = !query
      ? items
      : items.filter((category) => (category.name ?? '').toLowerCase().includes(query));
    return this.mergeSelectedCategoryOption(filtered);
  });

  readonly categoryOptionValue = (category: LedgerCategory): string => category.id ?? '';
  readonly categoryOptionLabel = (category: LedgerCategory): string => category.name ?? '';
  readonly categoryTrackBy = (_index: number, category: LedgerCategory): string =>
    category.id ?? '';
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
      const ledgercategoryid = routeParams.get('ledgercategoryid');
      const previousRouteCategoryId = this.lastRouteCategoryId;
      this.lastRouteCategoryId = ledgercategoryid;

      this.selectedCategoryId.set(ledgercategoryid);

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

      if (!ledgercategoryid) {
        this.lastBootstrapKey = null;
        this.nextLoadToken();
        if (previousRouteCategoryId) {
          this.draftCategoryId.set(null);
          this.categoryQuery.set('');
        }
        this.clearReport();
        void this.loadCategoryCatalogOnly();
        return;
      }

      if (!this.canViewLedgerCategoryReport()) {
        this.lastBootstrapKey = null;
        this.nextLoadToken();
        this.error.set(permissionError);
        this.clearReportData();
        return;
      }

      const bootstrapKey = `${ledgercategoryid}|${dateOperator}|${start}|${end}`;
      if (this.lastBootstrapKey === bootstrapKey) return;
      this.lastBootstrapKey = bootstrapKey;

      const token = this.nextLoadToken();
      void this.bootstrapLedgerCategoryReport(token, ledgercategoryid, start, end, dateOperator);
    });
  }

  openFilterPopover(): void {
    const operator = this.currentDateOperatorFromQuery();

    this.draftCategoryId.set(this.routeParams().get('ledgercategoryid'));
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

  onDraftCategoryChange(ledgercategoryid: string | null): void {
    this.draftCategoryId.set(ledgercategoryid);
  }

  applyFilters(): void {
    const queryParams =
      buildReportDateRouterQueryFromSelection(
        this.draftDateOperator(),
        this.draftPickerValue(),
        this.draftSingleDate(),
        (value) => this.fiscalYearDateRange.toIsoDate(value),
      ) ?? this.defaultReportDateRouterQuery();
    const ledgercategoryid = this.draftCategoryId();

    void this.router.navigate(
      ledgercategoryid
        ? ledgerCategoryReportPath(ledgercategoryid)
        : ledgerCategoryReportPathRoot(),
      {
        queryParams,
      },
    );
  }

  clearFilters(): void {
    this.draftCategoryId.set(null);
    this.draftDateOperator.set(DEFAULT_REPORT_DATE_OPERATOR);
    this.draftPickerValue.set(this.fiscalYearPickerValue());
    this.draftSingleDate.set(this.fiscalYearSingleDate());
  }

  onCategoryQueryChange(query: string): void {
    this.categoryQuery.set(query);
  }

  applyCategorySelection(): void {
    const ledgercategoryid = this.draftCategoryId();
    if (!ledgercategoryid) return;

    void this.router.navigate(ledgerCategoryReportPath(ledgercategoryid), {
      queryParams: this.currentReportDateRouterQuery(),
    });
  }

  onRefresh(): void {
    const ledgercategoryid = this.selectedCategoryId();
    if (!ledgercategoryid) return;

    if (!this.canViewLedgerCategoryReport()) {
      this.nextLoadToken();
      this.error.set(permissionError);
      this.clearReportData();
      return;
    }

    const token = this.nextLoadToken();
    const params = this.queryParams();
    void this.loadReport(
      token,
      ledgercategoryid,
      params.get('start'),
      params.get('end'),
      parseReportDateOperator(params.get(REPORT_DATE_OPERATOR_QUERY_PARAM)),
    );
  }

  viewJournal(journalid: string): void {
    if (!this.canOpenJournal()) return;
    void this.router.navigate(journalPath(journalid), {
      queryParams: { burl: this.router.url },
    });
  }

  openRowLedger(ledgerid: string): void {
    void this.router.navigate(ledgerReportPath(ledgerid), {
      queryParams: this.currentReportDateRouterQuery(),
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
    this.selectedCategoryMeta.set(null);
    this.title.set('');
    this.generatedAt.set('');
    this.summary.set(emptyLedgerCategoryReportSummary());
    this.tableRows.set([]);
  }

  private mergeSelectedCategoryOption(
    options: readonly LedgerCategory[],
  ): readonly LedgerCategory[] {
    const map = new Map<string, LedgerCategory>();
    for (const category of options) {
      if (category.id) map.set(category.id, category);
    }

    for (const ledgercategoryid of [this.selectedCategoryId(), this.draftCategoryId()]) {
      if (!ledgercategoryid || map.has(ledgercategoryid)) continue;

      const fromCatalog = this.ledgerCategoryStore
        .catalog()
        .find((category) => category.id === ledgercategoryid);
      if (fromCatalog) {
        map.set(ledgercategoryid, fromCatalog);
        continue;
      }

      const meta = this.selectedCategoryMeta();
      if (meta?.ledgercategoryid === ledgercategoryid && meta.ledgerCategoryName) {
        map.set(ledgercategoryid, {
          id: meta.ledgercategoryid,
          name: meta.ledgerCategoryName,
        });
      }
    }

    return [...map.values()];
  }

  private async bootstrapLedgerCategoryReport(
    token: number,
    ledgercategoryid: string,
    start: string | null,
    end: string | null,
    operator: ReportDateOperator,
  ): Promise<void> {
    try {
      await this.ensureCategoryCatalogLoaded();
      if (!this.isActiveLoad(token)) return;
      await this.loadReport(token, ledgercategoryid, start, end, operator);
    } catch (err) {
      if (!this.isActiveLoad(token)) return;
      this.error.set(getApiErrorMessage(err, 'Failed to load ledger category catalog.'));
      this.clearReportData();
      this.isLoading.set(false);
    }
  }

  private async ensureCategoryCatalogLoaded(): Promise<void> {
    if (!this.categoryCatalogPromise) {
      this.categoryCatalogPromise = this.fetchCategoryCatalog().finally(() => {
        this.categoryCatalogPromise = null;
      });
    }

    await this.categoryCatalogPromise;
  }

  private async loadCategoryCatalogOnly(): Promise<void> {
    try {
      await this.ensureCategoryCatalogLoaded();
    } catch (err) {
      this.error.set(getApiErrorMessage(err, 'Failed to load ledger category catalog.'));
    }
  }

  private async fetchCategoryCatalog(): Promise<void> {
    const loaded = await this.ledgerCategoryStore.ensureLedgerCategoryCatalogLoaded(false);
    if (!loaded) {
      throw new Error(
        this.ledgerCategoryStore.error() ?? 'Failed to load ledger category catalog.',
      );
    }
  }

  private async loadReport(
    token: number,
    ledgercategoryid: string,
    start: string | null,
    end: string | null,
    operator: ReportDateOperator,
  ): Promise<void> {
    if (!this.isActiveLoad(token)) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const report = await this.ledgerCategoryReportService.getLedgerCategoryReport(
        ledgercategoryid,
        buildReportDateQuery(start, end, operator),
      );
      if (!this.isActiveLoad(token)) return;

      this.applyReport(report);
      this.error.set(null);
    } catch (err) {
      if (!this.isActiveLoad(token)) return;

      this.error.set(getApiErrorMessage(err, 'Failed to load ledger category report.'));
      this.clearReportData();
    } finally {
      if (this.isActiveLoad(token)) {
        this.isLoading.set(false);
      }
    }
  }

  private applyReport(report: LedgerCategoryReport): void {
    this.selectedCategoryMeta.set(report.ledgerCategory);
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
