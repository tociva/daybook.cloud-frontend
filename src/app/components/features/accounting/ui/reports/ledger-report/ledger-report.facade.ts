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
  buildReportDateQuery,
  buildReportDateRouterQueryFromPicker,
  parseIsoDateToDate,
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
  private ledgerCatalogPromise: Promise<void> | null = null;
  private loadToken = 0;

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly generatedAt = signal('');
  readonly summary = signal<LedgerReportSummary>(emptyLedgerReportSummary());
  readonly tableRows = signal<readonly LedgerReportRow[]>([]);
  readonly selectedLedgerId = signal<string | null>(null);
  readonly ledgerQuery = signal('');
  readonly pickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);
  readonly draftLedgerId = signal<string | null>(null);
  readonly draftPickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);

  private readonly selectedLedgerMeta = signal<LedgerReportLedger | null>(null);

  readonly canViewLedgerReport = computed(() =>
    hasAccountingReportPermission(this.permissionsStore.all(), 'ledgerReport'),
  );

  readonly catalogError = computed(() => this.ledgerStore.error());
  readonly displayError = computed(() => this.error() ?? this.catalogError());
  readonly hasError = computed(() => this.displayError() !== null);
  readonly hasLedgerSelected = computed(() => !!this.selectedLedgerId());
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

      if (!ledgerid) {
        this.lastBootstrapKey = null;
        this.nextLoadToken();
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

      const bootstrapKey = `${ledgerid}|${start}|${end}`;
      if (this.lastBootstrapKey === bootstrapKey) return;
      this.lastBootstrapKey = bootstrapKey;

      const token = this.nextLoadToken();
      void this.bootstrapLedgerReport(token, ledgerid, start, end);
    });
  }

  openFilterPopover(): void {
    this.draftLedgerId.set(this.routeParams().get('ledgerid'));
    this.draftPickerValue.set(this.currentPickerValueFromQuery());
  }

  onDraftDateRangeChange(value: TngDateRangePickerSelectionInput<Date>): void {
    this.draftPickerValue.set(value);
  }

  onDraftLedgerChange(ledgerid: string | null): void {
    this.draftLedgerId.set(ledgerid);
  }

  applyFilters(): void {
    const queryParams =
      buildReportDateRouterQueryFromPicker(this.draftPickerValue(), (value) =>
        this.fiscalYearDateRange.toIsoDate(value),
      ) ?? this.defaultReportDateRouterQuery();
    const ledgerid = this.draftLedgerId();

    void this.router.navigate(ledgerid ? ledgerReportPath(ledgerid) : ledgerReportPathRoot(), {
      queryParams,
    });
  }

  clearFilters(): void {
    this.draftLedgerId.set(null);
    this.draftPickerValue.set(this.fiscalYearPickerValue());
  }

  onLedgerQueryChange(query: string): void {
    this.ledgerQuery.set(query);
  }

  onRefresh(): void {
    const ledgerid = this.selectedLedgerId();
    this.lastBootstrapKey = null;

    if (!ledgerid) {
      this.nextLoadToken();
      this.clearReport();
      void this.loadLedgerCatalogOnly(true);
      return;
    }

    if (!this.canViewLedgerReport()) {
      this.nextLoadToken();
      this.error.set(permissionError);
      this.clearReportData();
      return;
    }

    const token = this.nextLoadToken();
    const params = this.queryParams();
    void this.bootstrapLedgerReport(token, ledgerid, params.get('start'), params.get('end'), true);
  }

  viewJournal(journalid: string): void {
    void this.router.navigate(journalPath(journalid), {
      queryParams: { burl: this.router.url },
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
    this.selectedLedgerMeta.set(null);
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
    forceCatalogReload = false,
  ): Promise<void> {
    try {
      await this.ensureLedgerCatalogLoaded(forceCatalogReload);
      if (!this.isActiveLoad(token)) return;
      await this.loadReport(token, ledgerid, start, end);
    } catch (err) {
      if (!this.isActiveLoad(token)) return;
      this.error.set(getApiErrorMessage(err, 'Failed to load ledger catalog.'));
      this.clearReportData();
      this.isLoading.set(false);
    }
  }

  private async ensureLedgerCatalogLoaded(forceReload = false): Promise<void> {
    if (forceReload) {
      this.ledgerCatalogPromise = null;
    }

    if (!this.ledgerCatalogPromise) {
      this.ledgerCatalogPromise = this.fetchLedgerCatalog(forceReload).finally(() => {
        this.ledgerCatalogPromise = null;
      });
    }

    await this.ledgerCatalogPromise;
  }

  private async loadLedgerCatalogOnly(forceReload = false): Promise<void> {
    try {
      await this.ensureLedgerCatalogLoaded(forceReload);
    } catch (err) {
      this.error.set(getApiErrorMessage(err, 'Failed to load ledger catalog.'));
    }
  }

  private async fetchLedgerCatalog(forceReload = false): Promise<void> {
    const loaded = await this.ledgerStore.ensureLedgerCatalogLoaded(forceReload);
    if (!loaded) {
      throw new Error(this.ledgerStore.error() ?? 'Failed to load ledger catalog.');
    }
  }

  private async loadReport(
    token: number,
    ledgerid: string,
    start: string | null,
    end: string | null,
  ): Promise<void> {
    if (!this.isActiveLoad(token)) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const report = await this.ledgerReportService.getLedgerReport(
        ledgerid,
        buildReportDateQuery(start, end),
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
