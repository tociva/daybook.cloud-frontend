import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import type { TngTableColumn } from '@tailng-ui/components';
import {
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
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import { CrudFilterPopoverComponent, CrudListQueryService } from '../../../../../../shared/crud';
import type { CrudFilterField } from '../../../../../../shared/crud';
import type { BankCash } from '../../../data/bank-cash';
import { BankCashStore } from '../../../data/bank-cash';
import { BankCashReportService } from '../../../data/bank-cash-report';
import type { BankCashReport, BankCashReportQuery } from '../../../data/bank-cash-report';
import { normalizeBankCashReportTransaction } from './bank-cash-activity.util';
import type { BankCashActivityRow } from './bank-cash-activity.util';
import type { Lb4ListQuery, Lb4Where } from '../../../../../../shared/crud';

type ActivityBadgeTone = 'success' | 'warning';

const emptyReportTotals = { payment: 0, receipt: 0 };

import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
@Component({
  selector: 'app-list-bank-cash-activity',
  standalone: true,
  imports: [
    PageHeadingComponent,
    BurlBackButtonComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    TngIcon,
    TngTag,
    EmptyStateComponent,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
  ],
  templateUrl: './list-bank-cash-activity.component.html',
  styleUrl: './list-bank-cash-activity.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListBankCashActivityComponent {
  private readonly bankCashReportService = inject(BankCashReportService);
  private readonly dateManagement = inject(DateManagementService);
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly bankCashStore = inject(BankCashStore);

  private bankCashSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private loadToken = 0;

  protected readonly error = signal<string | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly report = signal<BankCashReport | null>(null);

  protected readonly hasError = computed(() => this.error() !== null);
  protected readonly rows = computed<readonly BankCashActivityRow[]>(() =>
    (this.report()?.transactions ?? []).map(normalizeBankCashReportTransaction),
  );
  protected readonly totals = computed(() => this.report()?.totals ?? emptyReportTotals);

  protected readonly bankCashOptionLabel = (bankCash: BankCash): string => bankCash.name;
  protected readonly bankCashOptionValue = (bankCash: BankCash): string => bankCash.id ?? '';
  protected readonly bankCashTrackBy = (_index: number, bankCash: BankCash): string =>
    bankCash.id ?? bankCash.name;

  protected readonly filterFields: readonly CrudFilterField[] = [
    {
      id: 'bcashid',
      label: 'Bank/Cash Account',
      placeholder: 'All bank/cash accounts',
      type: 'autocomplete',
      options: () => this.bankCashStore.items(),
      getOptionLabel: (option) =>
        this.bankCashOptionLabel(option as BankCash),
      getOptionValue: (option) =>
        this.bankCashOptionValue(option as BankCash),
      trackBy: (index, option) =>
        this.bankCashTrackBy(index, option as BankCash),
      queryChange: (query) => this.onBankCashQueryChange(query),
    },
    {
      id: 'date',
      label: 'Date',
      defaultOperator: 'between',
      type: 'date',
    },
  ];

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
    this.crudQuery.init((filter) => this.loadReport(this.mapFilterToReportQuery(filter), ++this.loadToken));
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

  protected refresh(): void {
    void this.loadReport(this.mapFilterToReportQuery(this.crudQuery.filter()), ++this.loadToken);
  }

  private mapFilterToReportQuery(filter: Lb4ListQuery): BankCashReportQuery {
    const where = filter.where ?? {};
    const bcashid = this.readTextValue(where, 'bcashid');
    const date = where['date'];
    const [start, end] = this.readDateRange(date);

    return {
      ...(bcashid ? { bcashid } : {}),
      ...(start ? { start } : {}),
      ...(end ? { end } : {}),
    };
  }

  private readTextValue(where: Lb4Where, key: string): string | null {
    const value = where[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private readDateRange(value: unknown): [string | null, string | null] {
    if (typeof value === 'string' && value) return [value, value];
    if (!value || typeof value !== 'object') return [null, null];

    const filter = value as { between?: readonly unknown[]; gte?: unknown; lte?: unknown };
    if (Array.isArray(filter.between)) {
      const [from, to] = filter.between;
      return [typeof from === 'string' ? from : null, typeof to === 'string' ? to : null];
    }

    const start = typeof filter.gte === 'string' ? filter.gte : null;
    const end = typeof filter.lte === 'string' ? filter.lte : null;
    return [start, end];
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
