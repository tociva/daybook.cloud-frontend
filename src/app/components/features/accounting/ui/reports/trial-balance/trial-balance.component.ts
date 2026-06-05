import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  TngButtonComponent,
  TngCardComponent,
  TngTreeTable,
  TngTreeTableCellTpl,
} from '@tailng-ui/components';
import type {
  TngDateRangePickerSelectionInput,
  TngTreeTableColumn,
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
import { TrialBalanceService } from '../../../data/trial-balance/trial-balance.service';
import { hasAccountingReportPermission } from '../../../shared/accounting-report-permissions';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';
import { LedgerCategoryStore } from '../../../data/ledger-category';
import type { LedgerCategory } from '../../../data/ledger-category';
import type { TrialBalanceItem, TrialBalanceListQuery } from '../../../data/trial-balance/trial-balance.model';

type TrialBalanceAmountKey =
  | 'openingDebit'
  | 'openingCredit'
  | 'runningDebit'
  | 'runningCredit'
  | 'closingDebit'
  | 'closingCredit';

type TrialBalanceAmounts = Record<TrialBalanceAmountKey, number>;

type TrialBalanceTreeRow = TrialBalanceAmounts & {
  children: TrialBalanceTreeRow[];
  key: string;
  kind: 'category' | 'ledger' | 'total';
  ledgercategoryid?: string;
  ledgerid?: string;
  name: string;
};

const amountKeys: readonly TrialBalanceAmountKey[] = [
  'openingDebit',
  'openingCredit',
  'runningDebit',
  'runningCredit',
  'closingDebit',
  'closingCredit',
];

const amountFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const emptyAmounts = (): TrialBalanceAmounts => ({
  openingDebit: 0,
  openingCredit: 0,
  runningDebit: 0,
  runningCredit: 0,
  closingDebit: 0,
  closingCredit: 0,
});

const toAmount = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const formatAmount = (value: number | null | undefined): string => {
  const amount = toAmount(value);
  return amount === 0 ? '' : amountFormatter.format(amount);
};

const addAmounts = (target: TrialBalanceAmounts, source: TrialBalanceAmounts): void => {
  for (const key of amountKeys) {
    target[key] += source[key];
  }
};

const amountsFromReportItem = (item: TrialBalanceItem | undefined): TrialBalanceAmounts => ({
  openingDebit: toAmount(item?.openingDebit),
  openingCredit: toAmount(item?.openingCredit),
  runningDebit: toAmount(item?.runningDebit),
  runningCredit: toAmount(item?.runningCredit),
  closingDebit: toAmount(item?.closingDebit),
  closingCredit: toAmount(item?.closingCredit),
});

const rowNameClass = (row: TrialBalanceTreeRow): string =>
  `trial-balance-name-cell trial-balance-${row.kind}-cell`;

const amountCellClass = (row: TrialBalanceTreeRow): string =>
  `trial-balance-amount-cell trial-balance-${row.kind}-cell`;

const reportCatalogPageSize = 1000;
const softColumnBorder =
  '1px solid color-mix(in srgb, var(--tng-semantic-border-subtle) 72%, var(--tng-semantic-foreground-muted) 28%)';
const ledgerColumnWidth = '28%';
const amountColumnWidth = '12%';

@Component({
  selector: 'app-trial-balance',
  standalone: true,
  imports: [
    CommonModule,
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    TngIcon,
    TngTreeTable,
    TngTreeTableCellTpl,
    FiscalYearDateRangePickerComponent,
  ],
  templateUrl: './trial-balance.component.html',
  styleUrl: './trial-balance.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialBalanceComponent implements OnInit {
  private readonly trialBalanceService = inject(TrialBalanceService);
  private readonly ledgerStore = inject(LedgerStore);
  private readonly ledgerCategoryStore = inject(LedgerCategoryStore);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly dateManagement = inject(DateManagementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly permissionsStore = inject(PermissionsStore);

  // Single RxJS bridge — Router has no native signal for query params yet.
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly reportData = signal<readonly TrialBalanceItem[]>([]);
  protected readonly generatedAt = signal<string>('');
  protected readonly canOpenLedgerReport = computed(() =>
    hasAccountingReportPermission(this.permissionsStore.all(), 'ledgerReport'),
  );
  protected readonly canOpenLedgerCategoryReport = computed(() =>
    hasAccountingReportPermission(this.permissionsStore.all(), 'ledgerCategoryReport'),
  );
  protected readonly expandedKeys = signal<readonly string[]>([]);
  private readonly expandedKeySet = computed(() => new Set(this.expandedKeys()));
  protected readonly pickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);
  // Tracks the in-progress selection while the popup is open.
  // Committed to the URL only when the popup closes.
  protected readonly pendingPickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);

  protected readonly displayError = computed(
    () => this.error() ?? this.ledgerCategoryStore.error() ?? this.ledgerStore.error(),
  );
  protected readonly hasError = computed(() => this.displayError() !== null);
  protected readonly isReportLoading = computed(
    () => this.isLoading() || this.ledgerCategoryStore.isLoading() || this.ledgerStore.isLoading(),
  );

  private readonly ledgerNameById = computed(() => {
    const map = new Map<string, string>();
    for (const l of this.ledgerStore.items()) {
      if (l.id && l.name) map.set(l.id, l.name);
    }
    return map;
  });

  private readonly trialBalanceByLedgerId = computed(() => {
    const names = this.ledgerNameById();
    const map = new Map<string, TrialBalanceItem>();
    for (const item of this.reportData()) {
      map.set(item.ledgerid, {
        ...item,
        name: names.get(item.ledgerid) ?? item.name,
      });
    }
    return map;
  });

  protected readonly trialBalanceTreeData = computed<readonly TrialBalanceTreeRow[]>(() => {
    const categories = this.ledgerCategoryStore.items();
    const ledgers = this.ledgerStore.items();
    const balances = this.trialBalanceByLedgerId();
    const categoryNodes = new Map<string, TrialBalanceTreeRow>();
    const rootRows: TrialBalanceTreeRow[] = [];

    for (const category of categories) {
      if (!category.id) continue;
      categoryNodes.set(category.id, this.createCategoryRow(category));
    }

    for (const category of categories) {
      if (!category.id) continue;
      const node = categoryNodes.get(category.id);
      if (!node) continue;

      const parentId = category.parentid ?? category.parent?.id ?? null;
      const parent = parentId && parentId !== category.id ? categoryNodes.get(parentId) : null;
      if (parent) {
        parent.children.push(node);
      } else {
        rootRows.push(node);
      }
    }

    const uncategorizedLedgers: TrialBalanceTreeRow[] = [];
    for (const ledger of ledgers) {
      if (!ledger.id) continue;
      const row = this.createLedgerRow(ledger, balances.get(ledger.id));
      const categoryId = ledger.categoryid ?? ledger.category?.id ?? null;
      const category = categoryId ? categoryNodes.get(categoryId) : null;
      if (category) {
        category.children.push(row);
      } else {
        uncategorizedLedgers.push(row);
      }
    }

    if (uncategorizedLedgers.length > 0) {
      rootRows.push({
        ...emptyAmounts(),
        children: uncategorizedLedgers,
        key: 'category:uncategorized',
        kind: 'category',
        name: 'Uncategorized',
      });
    }

    if (rootRows.length === 0) return [];

    const total = emptyAmounts();
    for (const row of rootRows) {
      const rowTotal = this.rollUpAmounts(row);
      addAmounts(total, rowTotal);
    }

    const totalRow: TrialBalanceTreeRow = {
      ...total,
      children: [],
      key: 'total',
      kind: 'total',
      name: 'Total',
    };

    return [...rootRows, totalRow];
  });

  private readonly expandableTreeKeys = computed(() => {
    const keys: string[] = [];
    const collect = (rows: readonly TrialBalanceTreeRow[]): void => {
      for (const row of rows) {
        if (row.kind === 'category' && row.children.length > 0) {
          keys.push(row.key);
          collect(row.children);
        }
      }
    };
    collect(this.trialBalanceTreeData());
    return keys;
  });

  protected readonly columns: readonly TngTreeTableColumn<TrialBalanceTreeRow>[] = [
    {
      key: 'name',
      label: 'Ledger Category / Ledger',
      width: ledgerColumnWidth,
      treeToggle: true,
      cellClass: rowNameClass,
      headerStyle: {
        'border-inline-end': softColumnBorder,
      },
      cellStyle: {
        'border-inline-end': softColumnBorder,
      },
    },
    {
      key: 'opening',
      label: 'Opening',
      headerStyle: {
        'border-inline-end': softColumnBorder,
      },
      children: [
        this.amountColumn('openingDebit', 'Debit'),
        this.amountColumn('openingCredit', 'Credit', true),
      ],
    },
    {
      key: 'running',
      label: 'Running',
      headerStyle: {
        'border-inline-end': softColumnBorder,
      },
      children: [
        this.amountColumn('runningDebit', 'Debit'),
        this.amountColumn('runningCredit', 'Credit', true),
      ],
    },
    {
      key: 'closing',
      label: 'Closing',
      children: [
        this.amountColumn('closingDebit', 'Debit'),
        this.amountColumn('closingCredit', 'Credit'),
      ],
    },
  ];

  constructor() {
    // Reacts whenever URL params or fiscal year changes.
    // Guards ensure it safely handles the async load of fiscal year on hard refresh.
    effect(() => {
      const params = this.queryParams();
      const range = this.fiscalYearDateRange.range();

      const start = params.get('start');
      const end = params.get('end');

      // Wait for fiscal year to load.
      if (!range) return;

      // Seed fiscal year defaults into URL when params are absent.
      // Navigation updates queryParams signal, re-running this effect with full values.
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

      // URL is source of truth — sync picker and fetch.
      this.pickerValue.set({
        start: this.parseIsoToDate(start),
        end: this.parseIsoToDate(end),
      });
      void this.loadTrialBalance(start, end);
    });

    effect(() => {
      this.expandedKeys.set(this.expandableTreeKeys());
    });
  }

  ngOnInit(): void {
    void this.loadReferenceData();
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

  protected onRefresh(): void {
    const params = this.queryParams();
    void this.loadReferenceData();
    void this.loadTrialBalance(
      params.get('start') ?? undefined,
      params.get('end') ?? undefined,
    );
  }

  protected readonly getTreeRowKey = (row: TrialBalanceTreeRow): string => row.key;

  protected readonly getTreeRowChildren = (
    row: TrialBalanceTreeRow,
  ): readonly TrialBalanceTreeRow[] => row.children;

  protected readonly getTreeRowClass = (row: TrialBalanceTreeRow): string =>
    `trial-balance-${row.kind}-row`;

  protected readonly formatGeneratedAt = (value: string | null | undefined): string =>
    this.dateManagement.formatDisplayDateTime(value, '—');

  protected onExpandedKeysChange(keys: readonly unknown[]): void {
    this.expandedKeys.set(keys.filter((key): key is string => typeof key === 'string'));
  }

  protected onLedgerNameClick(row: TrialBalanceTreeRow, event: Event): void {
    event.stopPropagation();
    if (!row.ledgerid || !this.canOpenLedgerReport()) return;

    const params = this.queryParams();
    void this.router.navigate(['/app/accounting/reports/ledger', row.ledgerid], {
      queryParams: {
        start: params.get('start'),
        end: params.get('end'),
      },
    });
  }

  protected onCategoryNameClick(row: TrialBalanceTreeRow, event: Event): void {
    event.stopPropagation();
    if (!row.ledgercategoryid || !this.canOpenLedgerCategoryReport()) return;

    const params = this.queryParams();
    void this.router.navigate(
      ['/app/accounting/reports/ledger-category', row.ledgercategoryid],
      {
        queryParams: {
          start: params.get('start'),
          end: params.get('end'),
        },
      },
    );
  }

  private amountColumn(
    key: TrialBalanceAmountKey,
    label: string,
    borderEnd = false,
  ): TngTreeTableColumn<TrialBalanceTreeRow> {
    return {
      key,
      label,
      accessor: (row) => (this.shouldHideBranchBalance(row) ? '' : formatAmount(row[key])),
      align: 'end',
      width: amountColumnWidth,
      cellClass: amountCellClass,
      headerStyle: borderEnd ? { 'border-inline-end': softColumnBorder } : undefined,
      cellStyle: borderEnd ? { 'border-inline-end': softColumnBorder } : undefined,
    };
  }

  private shouldHideBranchBalance(row: TrialBalanceTreeRow): boolean {
    return row.kind === 'category' && row.children.length > 0 && this.expandedKeySet().has(row.key);
  }

  private createCategoryRow(category: LedgerCategory): TrialBalanceTreeRow {
    return {
      ...emptyAmounts(),
      children: [],
      key: `category:${category.id}`,
      kind: 'category',
      ledgercategoryid: category.id,
      name: category.name,
    };
  }

  private createLedgerRow(
    ledger: Ledger,
    balance: TrialBalanceItem | undefined,
  ): TrialBalanceTreeRow {
    return {
      ...amountsFromReportItem(balance),
      children: [],
      key: `ledger:${ledger.id}`,
      kind: 'ledger',
      ledgerid: ledger.id,
      name: balance?.name ?? ledger.name,
    };
  }

  private rollUpAmounts(row: TrialBalanceTreeRow): TrialBalanceAmounts {
    if (row.kind === 'ledger') {
      return amountKeys.reduce<TrialBalanceAmounts>((amounts, key) => {
        amounts[key] = row[key];
        return amounts;
      }, emptyAmounts());
    }

    const total = emptyAmounts();
    for (const child of row.children) {
      addAmounts(total, this.rollUpAmounts(child));
    }

    for (const key of amountKeys) {
      row[key] = total[key];
    }
    return total;
  }

  private async loadReferenceData(): Promise<void> {
    await Promise.all([this.loadLedgerCategoriesForReport(), this.loadLedgersForReport()]);
  }

  private async loadLedgerCategoriesForReport(): Promise<void> {
    const query = {
      includes: ['parent'],
      limit: reportCatalogPageSize,
      offset: 0,
    };

    await this.ledgerCategoryStore.loadLedgerCategories(query);
    const count = this.ledgerCategoryStore.count();
    if (count > this.ledgerCategoryStore.items().length) {
      await this.ledgerCategoryStore.loadLedgerCategories({ ...query, limit: count });
    }
  }

  private async loadLedgersForReport(): Promise<void> {
    const query = {
      includes: ['category'],
      limit: reportCatalogPageSize,
      offset: 0,
    };

    await this.ledgerStore.loadLedgers(query);
    const count = this.ledgerStore.count();
    if (count > this.ledgerStore.items().length) {
      await this.ledgerStore.loadLedgers({ ...query, limit: count });
    }
  }

  private async loadTrialBalance(start?: string, end?: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const query: TrialBalanceListQuery = {};
      if (start) query.start = start;
      if (end) query.end = end;

      const report = await this.trialBalanceService.getTrialBalance(query);
      this.reportData.set(report.data);
      this.generatedAt.set(report.generatedAt);
      this.error.set(null);
    } catch (err) {
      this.error.set(getApiErrorMessage(err, 'Failed to load trial balance.'));
      this.reportData.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private parseIsoToDate(iso: string): Date | null {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }
}
