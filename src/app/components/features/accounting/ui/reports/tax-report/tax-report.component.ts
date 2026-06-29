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
import dayjs from 'dayjs';
import { TngButtonComponent, TngCardComponent, TngDateRangePickerComponent } from '@tailng-ui/components';
import type { TngDateRangePickerSelectionInput } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { DatepickerDateAdapterService } from '../../../../../../core/date/datepicker-date-adapter.service';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { getCurrencyMinorUnit } from '../../../../../../shared/format/currency';
import { XlsxExportButtonComponent } from '../../../../../../shared/xlsx-export';
import { DEFAULT_NODE_DATE_FORMAT } from '../../../../../../util/constants';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import type { TaxReportMonth } from '../../../data/tax-report/tax-report.model';
import { TaxReportService } from '../../../data/tax-report/tax-report.service';
import { createReportAmountFormatter } from '../../../shared/report-amount.util';
import { createTaxReportXlsxDocument } from './tax-report.export';
import {
  sortTaxReportMonths,
  taxAmountForMonth,
  taxGrandTotalForReport,
  taxMonthLabel,
  taxMonthRowKey,
  taxNamesForReport,
  taxTotalForMonth,
  taxTotalsForReport,
} from './tax-report.view-model';

type TaxAmountSide = 'debit' | 'credit';

@Component({
  selector: 'app-tax-report',
  standalone: true,
  imports: [
    PageHeadingComponent,
    BurlBackButtonComponent,
    TngButtonComponent,
    TngCardComponent,
    TngDateRangePickerComponent,
    TngIcon,
    XlsxExportButtonComponent,
  ],
  templateUrl: './tax-report.component.html',
  styleUrl: './tax-report.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxReportComponent {
  private readonly taxReportService = inject(TaxReportService);
  private readonly dateManagement = inject(DateManagementService);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly userSessionStore = inject(UserSessionStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly datepickerAdapter = inject(DatepickerDateAdapterService);
  private loadToken = 0;

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly reportTitle = signal('');
  protected readonly generatedAt = signal('');
  protected readonly reportData = signal<readonly TaxReportMonth[]>([]);
  protected readonly pickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);
  protected readonly pendingPickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);

  protected readonly hasError = computed(() => this.error() !== null);
  protected readonly taxNames = computed(() => taxNamesForReport(this.reportData()));
  protected readonly taxTotals = computed(() =>
    taxTotalsForReport(this.reportData(), this.taxNames()),
  );
  protected readonly grandTotal = computed(() => taxGrandTotalForReport(this.reportData()));
  protected readonly currencyMinorUnit = computed(() =>
    getCurrencyMinorUnit(this.userSessionStore.session()?.branch?.currencycode),
  );
  protected readonly formatAmount = computed(() =>
    createReportAmountFormatter(this.currencyMinorUnit()),
  );

  protected readonly formatGeneratedAt = (value: string | null | undefined): string =>
    this.dateManagement.formatDisplayDateTime(value, '—');

  protected readonly taxMonthRowKey = taxMonthRowKey;
  protected readonly monthLabel = taxMonthLabel;

  protected readonly exportTaxReport = async () =>
    createTaxReportXlsxDocument({
      generatedAt: this.generatedAt(),
      minorUnit: this.currencyMinorUnit(),
      months: this.reportData(),
      taxNames: this.taxNames(),
      title: this.reportTitle(),
    });

  constructor() {
    effect(() => {
      const params = this.queryParams();
      const start = params.get('start');
      const end = params.get('end');

      if (!start || !end) {
        const defaults = this.defaultDateRange();
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            start: start ?? defaults.start,
            end: end ?? defaults.end,
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

  protected onDateRangeChange(value: TngDateRangePickerSelectionInput<Date>): void {
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
    const start = params.get('start');
    const end = params.get('end');
    if (!start || !end) return;

    void this.loadReport(start, end);
  }

  protected monthAmount(month: TaxReportMonth, taxName: string, side: TaxAmountSide): string {
    return this.formatAmount()(taxAmountForMonth(month, taxName)[side]);
  }

  protected totalAmount(taxName: string, side: TaxAmountSide): string {
    return this.formatAmount()(this.taxTotals()[taxName]?.[side]);
  }

  protected monthTotalAmount(month: TaxReportMonth, side: TaxAmountSide): string {
    return this.formatAmount()(taxTotalForMonth(month)[side]);
  }

  protected grandTotalAmount(side: TaxAmountSide): string {
    return this.formatAmount()(this.grandTotal()[side]);
  }

  private defaultDateRange(): Readonly<{ start: string; end: string }> {
    const fiscalYearRange = this.fiscalYearDateRange.range();
    if (fiscalYearRange) {
      return {
        start: dayjs(fiscalYearRange.startdate)
          .subtract(1, 'month')
          .format(DEFAULT_NODE_DATE_FORMAT),
        end: dayjs(fiscalYearRange.enddate).subtract(1, 'month').format(DEFAULT_NODE_DATE_FORMAT),
      };
    }

    return {
      start: dayjs().startOf('year').subtract(1, 'month').format(DEFAULT_NODE_DATE_FORMAT),
      end: dayjs().subtract(1, 'month').format(DEFAULT_NODE_DATE_FORMAT),
    };
  }

  private async loadReport(start: string, end: string): Promise<void> {
    const token = ++this.loadToken;
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const report = await this.taxReportService.getTaxReport({ start, end });
      if (token !== this.loadToken) return;

      this.reportTitle.set(report.title);
      this.generatedAt.set(report.generatedAt);
      this.reportData.set(sortTaxReportMonths(report.data));
    } catch (error) {
      if (token !== this.loadToken) return;

      this.error.set(getApiErrorMessage(error, 'Failed to load tax report.'));
      this.reportTitle.set('');
      this.generatedAt.set('');
      this.reportData.set([]);
    } finally {
      if (token === this.loadToken) {
        this.isLoading.set(false);
      }
    }
  }

  private parseIsoToDate(iso: string): Date | null {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }
}
