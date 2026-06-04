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
import { TngButtonComponent, TngCardComponent } from '@tailng-ui/components';
import type { TngDateRangePickerSelectionInput } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import {
  FiscalYearDateRangePickerComponent,
  FiscalYearDateRangeService,
} from '../../../../../../shared/fiscal-year-date-range-picker';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { ProfitLossService } from '../../../data/profit-loss/profit-loss.service';
import type { ProfitLossItem, ProfitLossReport, ProfitLossQuery } from '../../../data/profit-loss/profit-loss.model';

const amountFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const toAmount = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const formatAmount = (value: number | null | undefined): string =>
  amountFormatter.format(toAmount(value));

const emptyData = (): ProfitLossReport['data'] => ({
  directIncome: [],
  directExpense: [],
  indirectIncome: [],
  indirectExpense: [],
  unclassifiedIncome: [],
  unclassifiedExpense: [],
  totals: {
    directIncome: 0,
    directExpense: 0,
    indirectIncome: 0,
    indirectExpense: 0,
    unclassifiedIncome: 0,
    unclassifiedExpense: 0,
    grossProfit: 0,
    grossLoss: 0,
    netProfit: 0,
    netLoss: 0,
  },
});

@Component({
  selector: 'app-profit-loss',
  standalone: true,
  imports: [
    CommonModule,
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    TngIcon,
    FiscalYearDateRangePickerComponent,
  ],
  templateUrl: './profit-loss.component.html',
  styleUrl: './profit-loss.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfitLossComponent {
  private readonly profitLossService = inject(ProfitLossService);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly dateManagement = inject(DateManagementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly reportData = signal<ProfitLossReport['data']>(emptyData());
  protected readonly generatedAt = signal<string>('');
  protected readonly pickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);
  protected readonly pendingPickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);

  protected readonly hasError = computed(() => this.error() !== null);

  protected readonly data = computed(() => this.reportData());
  protected readonly totals = computed(() => this.reportData().totals);

  protected readonly hasUnclassified = computed(
    () =>
      this.reportData().unclassifiedIncome.length > 0 ||
      this.reportData().unclassifiedExpense.length > 0,
  );

  protected readonly isGrossProfit = computed(() => this.totals().grossProfit > 0);
  protected readonly isNetProfit = computed(() => this.totals().netProfit > 0);

  protected readonly formatAmount = formatAmount;

  constructor() {
    effect(() => {
      const params = this.queryParams();
      const range = this.fiscalYearDateRange.range();

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
      void this.loadReport(start, end);
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

  protected onRefresh(): void {
    const params = this.queryParams();
    void this.loadReport(
      params.get('start') ?? undefined,
      params.get('end') ?? undefined,
    );
  }

  protected readonly formatGeneratedAt = (value: string | null | undefined): string =>
    this.dateManagement.formatDisplayDateTime(value, '—');

  protected itemAmount(item: ProfitLossItem): string {
    return formatAmount(item.amount);
  }

  private async loadReport(start?: string, end?: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const query: ProfitLossQuery = {};
      if (start) query.start = start;
      if (end) query.end = end;

      const report = await this.profitLossService.getProfitLoss(query);
      this.reportData.set(report.data);
      this.generatedAt.set(report.generatedAt);
      this.error.set(null);
    } catch (err) {
      this.error.set(getApiErrorMessage(err, 'Failed to load profit & loss report.'));
      this.reportData.set(emptyData());
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
