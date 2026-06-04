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
import type { TngDateValue } from '@tailng-ui/primitives';
import { TngIcon } from '@tailng-ui/icons';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { FiscalYearDatepickerComponent } from '../../../../../../shared/fiscal-year-datepicker';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { BalanceSheetService } from '../../../data/balance-sheet/balance-sheet.service';
import type { BalanceSheetItem, BalanceSheetReport, BalanceSheetQuery } from '../../../data/balance-sheet/balance-sheet.model';

const amountFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const toAmount = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const formatAmount = (value: number | null | undefined): string =>
  amountFormatter.format(toAmount(value));

const emptyData = (): BalanceSheetReport['data'] => ({
  assets: [],
  liabilities: [],
  adjustments: { currentYearProfit: 0, currentYearLoss: 0 },
  totals: {
    assets: 0,
    liabilities: 0,
    liabilitiesAndEquity: 0,
    currentYearProfit: 0,
    currentYearLoss: 0,
  },
});

@Component({
  selector: 'app-balance-sheet',
  standalone: true,
  imports: [
    CommonModule,
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    TngIcon,
    FiscalYearDatepickerComponent,
  ],
  templateUrl: './balance-sheet.component.html',
  styleUrl: './balance-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BalanceSheetComponent {
  private readonly balanceSheetService = inject(BalanceSheetService);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly dateManagement = inject(DateManagementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly reportData = signal<BalanceSheetReport['data']>(emptyData());
  protected readonly reportTitle = signal<string>('');
  protected readonly generatedAt = signal<string>('');

  // Single date picker value (end date only)
  protected readonly pickerValue = signal<Date | null>(null);

  protected readonly hasError = computed(() => this.error() !== null);
  protected readonly data = computed(() => this.reportData());
  protected readonly totals = computed(() => this.reportData().totals);
  protected readonly adjustments = computed(() => this.reportData().adjustments);

  protected readonly isCurrentYearProfit = computed(
    () => this.adjustments().currentYearProfit > 0,
  );

  protected readonly formatAmount = formatAmount;

  constructor() {
    effect(() => {
      const params = this.queryParams();
      const range = this.fiscalYearDateRange.range();

      const end = params.get('end');

      if (!range) return;

      if (!end) {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { end: range.enddate },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
        return;
      }

      this.pickerValue.set(this.parseIsoToDate(end));
      void this.loadReport(end);
    });
  }

  protected onDateChange(value: TngDateValue<Date>): void {
    const iso = this.fiscalYearDateRange.toIsoDate(value);
    if (!iso) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { end: iso },
      queryParamsHandling: 'merge',
    });
  }

  protected onRefresh(): void {
    const end = this.queryParams().get('end');
    void this.loadReport(end ?? undefined);
  }

  protected readonly formatGeneratedAt = (value: string | null | undefined): string =>
    this.dateManagement.formatDisplayDateTime(value, '—');

  protected itemAmount(item: BalanceSheetItem): string {
    return formatAmount(item.amount);
  }

  private async loadReport(end?: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const query: BalanceSheetQuery = {};
      if (end) query.end = end;

      const report = await this.balanceSheetService.getBalanceSheet(query);
      this.reportData.set(report.data);
      this.reportTitle.set(report.title);
      this.generatedAt.set(report.generatedAt);
      this.error.set(null);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load balance sheet');
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
