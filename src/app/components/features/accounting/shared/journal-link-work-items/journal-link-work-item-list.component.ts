import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngPaginator,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import type { Lb4SortChange } from '../../../../../shared/crud';
import { EmptyStateComponent } from '../../../../../shared/empty-state';
import { formatAmountWithCurrency } from '../../../../../shared/format/currency';
import { TableRowIconButtonComponent } from '../../../../../shared/table-row-icon-button';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import { DateManagementService } from '../../../../../core/date/date-management.service';
import { PermissionsStore } from '../../../../../core/permissions/permissions.store';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import { hasAccountingReportPermission } from '../accounting-report-permissions';
import {
  JOURNAL_LINK_WORK_ITEM_DEFAULT_LIMIT,
  applyJournalLinkWorkItemSortChange,
  journalLinkWorkItemQueryToParams,
  journalLinkWorkItemSortState,
  journalLinkWorkItemSourceLabel,
  journalLinkWorkItemStatusLabel,
  normalizeJournalLinkWorkItemQuery,
  parseJournalLinkWorkItemQuery,
} from '../../data/journal-link-work-item';
import type {
  JournalLinkWorkItem,
  JournalLinkWorkItemQuery,
  JournalLinkWorkItemSourceType,
} from '../../data/journal-link-work-item';
import { JournalLinkWorkItemService } from '../../data/journal-link-work-item';

@Component({
  selector: 'app-journal-link-work-item-list',
  imports: [
    EmptyStateComponent,
    TableRowIconButtonComponent,
    TngPaginator,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './journal-link-work-item-list.component.html',
  styleUrl: './journal-link-work-item-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalLinkWorkItemListComponent {
  private readonly dateManagement = inject(DateManagementService);
  private readonly permissionsStore = inject(PermissionsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(JournalLinkWorkItemService);
  private readonly userSessionStore = inject(UserSessionStore);

  readonly sourceType = input.required<JournalLinkWorkItemSourceType>();
  readonly hideSourceType = input(false);

  protected readonly items = signal<readonly JournalLinkWorkItem[]>([]);
  protected readonly totalItems = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly canViewDashboard = computed(() =>
    hasAccountingReportPermission(this.permissionsStore, 'accountantDashboard'),
  );

  protected readonly query = computed(() =>
    parseJournalLinkWorkItemQuery(this.queryParams(), this.sourceType()),
  );

  protected readonly sortState = computed(() => journalLinkWorkItemSortState(this.query().order));
  protected readonly sortActive = computed(() => this.sortState().active);
  protected readonly sortDirection = computed(() => this.sortState().direction);
  protected readonly pageIndex = computed(() => {
    const query = this.query();
    return Math.floor((query.skip ?? 0) / (query.limit ?? JOURNAL_LINK_WORK_ITEM_DEFAULT_LIMIT));
  });
  protected readonly pageSize = computed(() => this.query().limit ?? JOURNAL_LINK_WORK_ITEM_DEFAULT_LIMIT);
  protected readonly pageSizeOptions = [50, 100, 200] as const;

  protected readonly columns = computed<readonly TngTableColumn<JournalLinkWorkItem>[]>(() => {
    const sourceColumn: TngTableColumn<JournalLinkWorkItem> = {
      id: 'sourceType',
      label: 'Source',
      sortable: true,
      width: '11rem',
    };

    return [
      ...(this.hideSourceType() ? [] : [sourceColumn]),
      { id: 'date', label: 'Date', sortable: true, width: '9rem' },
      { id: 'number', label: 'Number', sortable: true, width: '12rem' },
      { id: 'partyName', label: 'Party', sortable: true, width: '14rem' },
      {
        id: 'sourceAmount',
        label: 'Source amount',
        sortable: true,
        align: 'end',
        headerAlign: 'end',
        width: '11rem',
      },
      {
        id: 'matchedAmount',
        label: 'Matched',
        sortable: true,
        align: 'end',
        headerAlign: 'end',
        width: '10rem',
      },
      {
        id: 'pendingAmount',
        label: 'Pending',
        sortable: true,
        align: 'end',
        headerAlign: 'end',
        width: '10rem',
      },
      { id: 'linkStatus', label: 'Status', sortable: true, width: '9rem' },
      { id: 'journals', label: 'Journals', width: '12rem' },
      { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '7rem' },
    ];
  });

  protected readonly noticeText = computed(() => {
    const query = this.query();
    const sourceType = query.sourceType ?? this.sourceType();
    const status = query.status ?? 'not_fully_linked';

    return `Showing dashboard results for ${journalLinkWorkItemSourceLabel(sourceType).toLowerCase()} records that are ${journalLinkWorkItemStatusLabel(status)}. Applying standard filters returns to the full list.`;
  });

  private loadGeneration = 0;

  constructor() {
    effect(() => {
      const canView = this.canViewDashboard();
      const query = this.query();

      queueMicrotask(() => {
        if (!canView) {
          this.items.set([]);
          this.totalItems.set(0);
          this.error.set(null);
          this.isLoading.set(false);
          return;
        }

        void this.load(query);
      });
    });
  }

  protected formatDate(value: string | null | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '-');
  }

  protected formatAmount(value: number | null | undefined): string {
    const session = this.userSessionStore.session();
    const fiscalYear = session?.fiscalyear;
    const branch = session?.branch;
    const currencyCode = fiscalYear?.currencycode ?? branch?.currencycode ?? 'INR';

    return formatAmountWithCurrency(Number(value ?? 0), currencyCode, fiscalYear?.currency ?? null);
  }

  protected sourceLabel(sourceType: JournalLinkWorkItemSourceType): string {
    return journalLinkWorkItemSourceLabel(sourceType);
  }

  protected linkStatusLabel(status: JournalLinkWorkItem['linkStatus']): string {
    switch (status) {
      case 'unlinked':
        return 'Unlinked';
      case 'partial':
        return 'Partial';
      case 'linked':
        return 'Linked';
    }
  }

  protected viewSource(item: JournalLinkWorkItem): void {
    void this.router.navigate(this.sourceRoute(item), {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewJournal(journal: JournalLinkWorkItem['journals'][number]): void {
    void this.router.navigate(['/app/accounting/journal', journal.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected async applySort(sort: Lb4SortChange): Promise<void> {
    await this.updateQuery(applyJournalLinkWorkItemSortChange(this.query(), sort));
  }

  protected async onPageIndexChange(pageIndex: number): Promise<void> {
    const query = this.query();
    const limit = query.limit ?? JOURNAL_LINK_WORK_ITEM_DEFAULT_LIMIT;
    await this.updateQuery({
      ...query,
      limit,
      skip: Math.max(0, pageIndex) * limit,
    });
  }

  protected async onPageSizeChange(pageSize: number): Promise<void> {
    await this.updateQuery({
      ...this.query(),
      limit: pageSize,
      skip: 0,
    });
  }

  private async load(rawQuery: JournalLinkWorkItemQuery): Promise<void> {
    const generation = ++this.loadGeneration;
    const query = normalizeJournalLinkWorkItemQuery(rawQuery);

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const [items, count] = await Promise.all([
        this.service.list(query),
        this.service.count(query),
      ]);

      if (generation !== this.loadGeneration) return;

      this.items.set(items);
      this.totalItems.set(count);
      this.error.set(null);
    } catch (error) {
      if (generation !== this.loadGeneration) return;

      this.items.set([]);
      this.totalItems.set(0);
      this.error.set(getApiErrorMessage(error, 'Failed to load journal link work items.'));
    } finally {
      if (generation === this.loadGeneration) {
        this.isLoading.set(false);
      }
    }
  }

  private async updateQuery(query: JournalLinkWorkItemQuery): Promise<void> {
    const normalized = normalizeJournalLinkWorkItemQuery(query);
    await this.router.navigate([], {
      queryParams: journalLinkWorkItemQueryToParams(normalized),
      queryParamsHandling: 'merge',
      relativeTo: this.route,
    });
  }

  private sourceRoute(item: JournalLinkWorkItem): string[] {
    switch (item.sourceType) {
      case 'sale_invoice':
        return ['/app/trading/sale-invoice', item.sourceId];
      case 'purchase_invoice':
        return ['/app/trading/purchase-invoice', item.sourceId];
      case 'receipt':
        return ['/app/trading/customer-receipt', item.sourceId];
      case 'payment':
        return ['/app/trading/vendor-payment', item.sourceId];
      case 'bank_txn':
        return ['/app/accounting/banking', item.sourceId];
      case 'contra':
        return ['/app/trading/bank-cash/contra', item.sourceId];
    }
  }
}
