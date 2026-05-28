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
  TngTable,
} from '@tailng-ui/components';
import type { TngTableColumn, TngDateRangePickerSelectionInput } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import {
  FiscalYearDateRangePickerComponent,
  FiscalYearDateRangeService,
} from '../../../../../../shared/fiscal-year-date-range-picker';
import { TrialBalanceService } from '../../../data/trial-balance/trial-balance.service';
import { LedgerStore } from '../../../data/ledger';
import type { TrialBalanceItem, TrialBalanceListQuery } from '../../../data/trial-balance/trial-balance.model';

@Component({
  selector: 'app-trial-balance',
  standalone: true,
  imports: [
    CommonModule,
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    TngIcon,
    EmptyStateComponent,
    TngTable,
    FiscalYearDateRangePickerComponent,
  ],
  templateUrl: './trial-balance.component.html',
  styleUrl: './trial-balance.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialBalanceComponent implements OnInit {
  private readonly trialBalanceService = inject(TrialBalanceService);
  private readonly ledgerStore = inject(LedgerStore);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Single RxJS bridge — Router has no native signal for query params yet.
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly reportData = signal<readonly TrialBalanceItem[]>([]);
  protected readonly updatedAt = signal<string>('');
  protected readonly sortActive = signal<string | null>(null);
  protected readonly sortDirection = signal<'asc' | 'desc' | null>(null);
  protected readonly pickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);
  // Tracks the in-progress selection while the popup is open.
  // Committed to the URL only when the popup closes.
  protected readonly pendingPickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);

  protected readonly hasError = computed(() => this.error() !== null);

  private readonly ledgerNameById = computed(() => {
    const map = new Map<string, string>();
    for (const l of this.ledgerStore.items()) {
      if (l.id && l.name) map.set(l.id, l.name);
    }
    return map;
  });

  protected readonly trialBalanceData = computed(() => {
    const names = this.ledgerNameById();
    return this.reportData().map((item) => ({
      ...item,
      name: names.get(item.ledgerid) ?? item.name,
    }));
  });

  protected readonly columns: readonly TngTableColumn<TrialBalanceItem>[] = [
    { id: 'name', label: 'Ledger Name', sortable: true, width: '15rem' },
    { id: 'openingDebit', label: 'Opening DR', sortable: true, width: '11rem', align: 'end', headerAlign: 'end' },
    { id: 'openingCredit', label: 'Opening CR', sortable: true, width: '11rem', align: 'end', headerAlign: 'end' },
    { id: 'runningDebit', label: 'Running DR', sortable: true, width: '11rem', align: 'end', headerAlign: 'end' },
    { id: 'runningCredit', label: 'Running CR', sortable: true, width: '11rem', align: 'end', headerAlign: 'end' },
    { id: 'closingDebit', label: 'Closing DR', sortable: true, width: '11rem', align: 'end', headerAlign: 'end' },
    { id: 'closingCredit', label: 'Closing CR', sortable: true, width: '11rem', align: 'end', headerAlign: 'end' },
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
  }

  ngOnInit(): void {
    void this.ledgerStore.loadLedgers({ limit: 1000, offset: 0 });
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
    void this.loadTrialBalance(
      params.get('start') ?? undefined,
      params.get('end') ?? undefined,
    );
  }

  protected onSortChange(event: { activeColumnId: string | null; direction: 'asc' | 'desc' | null }): void {
    this.sortActive.set(event.activeColumnId);
    this.sortDirection.set(event.direction as 'asc' | 'desc' | null);
  }

  protected formatAmount(value: number | null): string {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
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
      this.updatedAt.set(report.updatedAt);
      this.error.set(null);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load trial balance');
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
