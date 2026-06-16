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
import type { TngDateRangePickerSelectionInput, TngTableColumn } from '@tailng-ui/components';
import {
  TngAutocompleteComponent,
  TngButtonComponent,
  TngCardComponent,
  TngTable,
  TngTableCellTpl,
  TngTag,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { FiscalYearDateRangePickerComponent } from '../../../../../../shared/fiscal-year-date-range-picker';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import type { BankCash } from '../../../data/bank-cash';
import { BankCashStore } from '../../../data/bank-cash';
import { BankCashReportService } from '../../../data/bank-cash-report';
import type { BankCashReport, BankCashReportQuery } from '../../../data/bank-cash-report';
import {
  buildReportDateRouterQueryFromPicker,
  parseIsoDateToDate,
} from '../../../../accounting/ui/reports/shared/report-date-query.util';
import { normalizeBankCashReportTransaction } from './bank-cash-activity.util';
import type { BankCashActivityRow } from './bank-cash-activity.util';

type ActivityBadgeTone = 'success' | 'warning';

const emptyReportTotals = { payment: 0, receipt: 0 };

@Component({
  selector: 'app-list-bank-cash-activity',
  standalone: true,
  imports: [
    PageHeadingComponent,
    TngAutocompleteComponent,
    TngButtonComponent,
    TngCardComponent,
    FiscalYearDateRangePickerComponent,
    TngIcon,
    TngTag,
    EmptyStateComponent,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
  ],
  templateUrl: './list-bank-cash-activity.component.html',
  styleUrl: './list-bank-cash-activity.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListBankCashActivityComponent {
  private readonly bankCashReportService = inject(BankCashReportService);
  private readonly dateManagement = inject(DateManagementService);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly bankCashStore = inject(BankCashStore);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private bankCashSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private lastLoadKey = '';
  private loadToken = 0;

  protected readonly error = signal<string | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly report = signal<BankCashReport | null>(null);
  protected readonly selectedBankCashId = signal<string | null>(null);
  protected readonly pickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);
  protected readonly pendingPickerValue = signal<TngDateRangePickerSelectionInput<Date>>(null);

  protected readonly hasError = computed(() => this.error() !== null);
  protected readonly rows = computed<readonly BankCashActivityRow[]>(() =>
    (this.report()?.transactions ?? []).map(normalizeBankCashReportTransaction),
  );
  protected readonly totals = computed(() => this.report()?.totals ?? emptyReportTotals);

  protected readonly bankCashOptionLabel = (bankCash: BankCash): string => bankCash.name;
  protected readonly bankCashOptionValue = (bankCash: BankCash): string => bankCash.id ?? '';
  protected readonly bankCashTrackBy = (_index: number, bankCash: BankCash): string =>
    bankCash.id ?? bankCash.name;

  protected readonly columns: readonly TngTableColumn<BankCashActivityRow>[] = [
    { id: 'date', label: 'Date', width: '10rem' },
    { id: 'sourceLabel', label: 'Type', width: '8rem' },
    { id: 'contraLeg', label: 'Leg', width: '7rem' },
    { id: 'counterpartyName', label: 'Counterparty', width: '14rem' },
    {
      id: 'receipt',
      label: 'Receipt',
      align: 'end',
      headerAlign: 'end',
      width: '11rem',
    },
    {
      id: 'payment',
      label: 'Payment',
      align: 'end',
      headerAlign: 'end',
      width: '11rem',
    },
    { id: 'description', label: 'Description', truncate: true },
    { id: 'actions', label: 'Source', align: 'end', headerAlign: 'end', width: '6rem' },
  ];

  constructor() {
    void this.bankCashStore.loadBankCashes({ limit: 1000, offset: 0 });

    effect(() => {
      const params = this.queryParams();
      const bcashid = params.get('bcashid');
      const start = params.get('start');
      const end = params.get('end');

      this.selectedBankCashId.set(bcashid);
      this.pickerValue.set({
        start: parseIsoDateToDate(start),
        end: parseIsoDateToDate(end),
      });
      this.pendingPickerValue.set(this.pickerValue());

      const loadKey = `${bcashid ?? ''}|${start ?? ''}|${end ?? ''}`;
      if (this.lastLoadKey === loadKey) return;
      this.lastLoadKey = loadKey;

      const token = ++this.loadToken;
      void this.loadReport(
        {
          ...(bcashid ? { bcashid } : {}),
          ...(start ? { start } : {}),
          ...(end ? { end } : {}),
        },
        token,
      );
    });
  }

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '-');
  }

  protected formatMoney(
    value: number | null | undefined,
    currencycode: string | undefined,
  ): string {
    return Number(value ?? 0) === 0 ? '' : formatAmountWithCurrency(Number(value), currencycode);
  }

  protected getTypeTone(row: BankCashActivityRow): ActivityBadgeTone {
    return row.receipt > 0 ? 'success' : 'warning';
  }

  protected backToAccounts(): void {
    void this.router.navigate(['/app/trading/bank-cash']);
  }

  protected openSource(row: BankCashActivityRow): void {
    if (!row.sourceRoute) return;

    void this.router.navigate(row.sourceRoute, {
      queryParams: { burl: this.router.url },
    });
  }

  protected onBankCashQueryChange(value: unknown): void {
    const query = typeof value === 'string' ? value.trim() : '';
    if (this.bankCashSearchTimer) clearTimeout(this.bankCashSearchTimer);
    this.bankCashSearchTimer = setTimeout(() => {
      void this.bankCashStore.loadBankCashes(
        query
          ? { limit: 50, offset: 0, where: { name: { ilike: `%${query}%` } } }
          : { limit: 1000, offset: 0 },
      );
    }, 250);
  }

  protected onBankCashChange(value: unknown): void {
    const bcashid = typeof value === 'string' && value ? value : null;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { bcashid },
      queryParamsHandling: 'merge',
    });
  }

  protected onDateRangeChange(value: TngDateRangePickerSelectionInput<Date>): void {
    this.pendingPickerValue.set(value);
  }

  protected onPickerClosed(): void {
    const queryParams = buildReportDateRouterQueryFromPicker(this.pendingPickerValue(), (value) =>
      this.fiscalYearDateRange.toIsoDate(value),
    );
    if (!queryParams) return;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  protected refresh(): void {
    this.lastLoadKey = '';
    const params = this.queryParams();
    const token = ++this.loadToken;
    void this.loadReport(
      {
        ...(params.get('bcashid') ? { bcashid: params.get('bcashid') ?? undefined } : {}),
        ...(params.get('start') ? { start: params.get('start') ?? undefined } : {}),
        ...(params.get('end') ? { end: params.get('end') ?? undefined } : {}),
      },
      token,
    );
  }

  private async loadReport(query: BankCashReportQuery, token: number): Promise<void> {
    this.error.set(null);
    this.isLoading.set(true);

    try {
      const report = await this.bankCashReportService.getBankCashReport(query);
      if (token !== this.loadToken) return;
      this.report.set(report);
    } catch (error) {
      if (token !== this.loadToken) return;
      this.error.set(getApiErrorMessage(error, 'Failed to load bank/cash activity.'));
      this.report.set(null);
    } finally {
      if (token === this.loadToken) {
        this.isLoading.set(false);
      }
    }
  }
}
