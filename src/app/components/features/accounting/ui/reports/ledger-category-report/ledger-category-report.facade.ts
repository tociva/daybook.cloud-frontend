import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import type { TngDateRangePickerSelectionInput } from '@tailng-ui/components';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
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
  buildReportDateQuery,
  buildReportDateRouterQueryFromPicker,
  parseIsoDateToDate,
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
  readonly draftPickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);

  private readonly selectedCategoryMeta = signal<LedgerCategoryReportCategory | null>(null);

  readonly canViewLedgerCategoryReport = computed(() =>
    hasAccountingReportPermission(this.permissionsStore.all(), 'ledgerCategoryReport'),
  );

  readonly canOpenLedgerReport = computed(() =>
    hasAccountingReportPermission(this.permissionsStore.all(), 'ledgerReport'),
  );

  readonly catalogError = computed(() => this.ledgerCategoryStore.error());
  readonly displayError = computed(() => this.error() ?? this.catalogError());
  readonly hasError = computed(() => this.displayError() !== null);
  readonly hasCategorySelected = computed(() => !!this.selectedCategoryId());
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

      if (!range) return;

      const seededQuery = seedMissingReportDateQuery(start, end, range);
      if (seededQuery) {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: seededQuery,
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
        return;
      }

      this.pickerValue.set({
        start: parseIsoDateToDate(start),
        end: parseIsoDateToDate(end),
      });

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

      const bootstrapKey = `${ledgercategoryid}|${start}|${end}`;
      if (this.lastBootstrapKey === bootstrapKey) return;
      this.lastBootstrapKey = bootstrapKey;

      const token = this.nextLoadToken();
      void this.bootstrapLedgerCategoryReport(token, ledgercategoryid, start, end);
    });
  }

  openFilterPopover(): void {
    this.draftCategoryId.set(this.routeParams().get('ledgercategoryid'));
    this.draftPickerValue.set(this.currentPickerValueFromQuery());
  }

  onDraftDateRangeChange(value: TngDateRangePickerSelectionInput<Date>): void {
    this.draftPickerValue.set(value);
  }

  onDraftCategoryChange(ledgercategoryid: string | null): void {
    this.draftCategoryId.set(ledgercategoryid);
  }

  applyFilters(): void {
    const queryParams =
      buildReportDateRouterQueryFromPicker(this.draftPickerValue(), (value) =>
        this.fiscalYearDateRange.toIsoDate(value),
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
    this.draftPickerValue.set(this.fiscalYearPickerValue());
  }

  onCategoryQueryChange(query: string): void {
    this.categoryQuery.set(query);
  }

  applyCategorySelection(): void {
    const ledgercategoryid = this.draftCategoryId();
    if (!ledgercategoryid) return;

    const params = this.queryParams();
    void this.router.navigate(ledgerCategoryReportPath(ledgercategoryid), {
      queryParams: {
        start: params.get('start'),
        end: params.get('end'),
      },
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
    );
  }

  viewJournal(journalid: string): void {
    void this.router.navigate(journalPath(journalid), {
      queryParams: { burl: this.router.url },
    });
  }

  openRowLedger(ledgerid: string): void {
    const params = this.queryParams();
    void this.router.navigate(ledgerReportPath(ledgerid), {
      queryParams: {
        start: params.get('start'),
        end: params.get('end'),
      },
    });
  }

  openOppositeLedger(ledgerid: string): void {
    const params = this.queryParams();
    void this.router.navigate(ledgerReportPath(ledgerid), {
      queryParams: {
        start: params.get('start'),
        end: params.get('end'),
      },
    });
  }

  private currentPickerValueFromQuery(): TngDateRangePickerSelectionInput<Date> {
    const params = this.queryParams();
    const range = this.fiscalYearDateRange.range();
    const start = params.get('start') ?? range?.startdate ?? null;
    const end = params.get('end') ?? range?.enddate ?? null;

    return {
      start: parseIsoDateToDate(start),
      end: parseIsoDateToDate(end),
    };
  }

  private fiscalYearPickerValue(): TngDateRangePickerSelectionInput<Date> {
    const range = this.fiscalYearDateRange.range();
    if (!range) return null;

    return {
      start: parseIsoDateToDate(range.startdate),
      end: parseIsoDateToDate(range.enddate),
    };
  }

  private defaultReportDateRouterQuery(): { end: string | null; start: string | null } {
    const range = this.fiscalYearDateRange.range();
    return {
      start: range?.startdate ?? null,
      end: range?.enddate ?? null,
    };
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
  ): Promise<void> {
    try {
      await this.ensureCategoryCatalogLoaded();
      if (!this.isActiveLoad(token)) return;
      await this.loadReport(token, ledgercategoryid, start, end);
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
  ): Promise<void> {
    if (!this.isActiveLoad(token)) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const report = await this.ledgerCategoryReportService.getLedgerCategoryReport(
        ledgercategoryid,
        buildReportDateQuery(start, end),
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
