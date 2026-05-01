import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngInputComponent,
  TngLabelComponent,
  TngPaginator,
  TngSelectComponent,
  TngTag,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import type { TngTableSortDirection } from '@tailng-ui/cdk';
import { TngIcon } from '@tailng-ui/icons';
import { TngPopover, TngPopoverPanel, TngPopoverTrigger } from '@tailng-ui/primitives';
import { BankCashStore, Status } from '../../../data/bank-cash';
import type { BankCash, BankCashListQuery } from '../../../data/bank-cash';
import { TngTagIcon } from '../tng-tag-icon.directive';

type StatusBadgeTone = 'danger' | 'success' | 'warning';
type BankCashFilterWhere = Record<string, unknown>;
type FilterOperatorOption<T extends string = string> = Readonly<{
  label: string;
  value: T;
}>;
type TextFilterOperator = '=' | '!=' | 'like';
type StatusFilterOperator = '!=' | '<' | '<=' | '=' | '>' | '>=';
type StatusFilterOption = Readonly<{
  label: string;
  value: Status;
}>;

const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-list-bank-cash',
  imports: [
    TngButtonComponent,
    TngCardComponent,
    TngIcon,
    TngInputComponent,
    TngLabelComponent,
    TngPaginator,
    TngSelectComponent,
    TngPopover,
    TngPopoverPanel,
    TngPopoverTrigger,
    TngTag,
    TngTagIcon,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './list-bank-cash.component.html',
  styleUrl: './list-bank-cash.component.css',
})
export class ListBankCashComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly bankCashStore = inject(BankCashStore);
  protected readonly filterPopoverOpen = signal(false);
  protected readonly filterName = signal('');
  protected readonly filterNameOperator = signal<TextFilterOperator>('like');
  protected readonly filterDescription = signal('');
  protected readonly filterDescriptionOperator = signal<TextFilterOperator>('like');
  protected readonly filterStatus = signal<Status | null>(null);
  protected readonly filterStatusOperator = signal<StatusFilterOperator>('=');
  protected readonly nameFilter = signal('');
  protected readonly nameFilterOperator = signal<TextFilterOperator>('like');
  protected readonly descriptionFilter = signal('');
  protected readonly descriptionFilterOperator = signal<TextFilterOperator>('like');
  protected readonly statusFilter = signal<Status | null>(null);
  protected readonly statusFilterOperator = signal<StatusFilterOperator>('=');
  protected readonly hasError = computed(() => this.bankCashStore.error() !== null);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  protected readonly pageSizeOptions = [10, 25, 50] as const;
  protected readonly sortActive = signal<string | null>(null);
  protected readonly sortDirection = signal<TngTableSortDirection | null>(null);
  protected readonly columns: readonly TngTableColumn<BankCash>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '18rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'status', label: 'Status', sortable: true, width: '9rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];
  protected readonly statusFilterOptions: readonly StatusFilterOption[] = [
    { label: 'Active', value: Status.ACTIVE },
    { label: 'Inactive', value: Status.INACTIVE },
    { label: 'Deleted', value: Status.DELETED },
  ];
  protected readonly textOperatorOptions: readonly FilterOperatorOption<TextFilterOperator>[] = [
    { label: 'Like', value: 'like' },
    { label: '=', value: '=' },
    { label: '!=', value: '!=' },
  ];
  protected readonly statusOperatorOptions: readonly FilterOperatorOption<StatusFilterOperator>[] = [
    { label: '=', value: '=' },
    { label: '!=', value: '!=' },
    { label: '<', value: '<' },
    { label: '<=', value: '<=' },
    { label: '>', value: '>' },
    { label: '>=', value: '>=' },
  ];
  protected readonly getOperatorLabel = <T extends string>(option: FilterOperatorOption<T>): string =>
    option.label;
  protected readonly getOperatorValue = <T extends string>(option: FilterOperatorOption<T>): T =>
    option.value;
  protected readonly getStatusFilterLabel = (option: StatusFilterOption): string => option.label;
  protected readonly getStatusFilterValue = (option: StatusFilterOption): Status => option.value;

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const filter = this.parseFilter(params.get('filter'));
      this.syncStateFromFilter(filter);
      void this.bankCashStore.loadBankCashes(filter);
    });
  }

  protected onFilterPopoverOpenChange(open: boolean): void {
    this.filterPopoverOpen.set(open);

    if (open) {
      this.filterName.set(this.nameFilter());
      this.filterNameOperator.set(this.nameFilterOperator());
      this.filterDescription.set(this.descriptionFilter());
      this.filterDescriptionOperator.set(this.descriptionFilterOperator());
      this.filterStatus.set(this.statusFilter());
      this.filterStatusOperator.set(this.statusFilterOperator());
    }
  }

  protected async submitFilter(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    await this.updateFilterInUrl({
      ...this.getCurrentFilter(),
      offset: 0,
      where: this.buildFilterWhere(),
    });
    this.filterPopoverOpen.set(false);
  }

  protected async clearFilter(): Promise<void> {
    this.filterName.set('');
    this.filterNameOperator.set('like');
    this.filterDescription.set('');
    this.filterDescriptionOperator.set('like');
    this.filterStatus.set(null);
    this.filterStatusOperator.set('=');
    await this.updateFilterInUrl({
      ...this.getCurrentFilter(),
      offset: 0,
      where: undefined,
    });
    this.filterPopoverOpen.set(false);
  }

  protected onFilterNameOperatorChange(operator: TextFilterOperator | null): void {
    this.filterNameOperator.set(operator ?? 'like');
  }

  protected onFilterDescriptionOperatorChange(operator: TextFilterOperator | null): void {
    this.filterDescriptionOperator.set(operator ?? 'like');
  }

  protected onFilterStatusChange(status: Status | null): void {
    this.filterStatus.set(status);
  }

  protected onFilterStatusOperatorChange(operator: StatusFilterOperator | null): void {
    this.filterStatusOperator.set(operator ?? '=');
  }

  protected async onPageIndexChange(pageIndex: number): Promise<void> {
    const limit = this.pageSize();
    await this.updateFilterInUrl({
      ...this.getCurrentFilter(),
      limit,
      offset: pageIndex * limit,
    });
  }

  protected async onPageSizeChange(pageSize: number): Promise<void> {
    await this.updateFilterInUrl({
      ...this.getCurrentFilter(),
      limit: pageSize,
      offset: 0,
    });
  }

  protected async onSortChange(event: {
    activeColumnId: string | null;
    direction: TngTableSortDirection | null;
  }): Promise<void> {
    await this.updateFilterInUrl({
      ...this.getCurrentFilter(),
      offset: 0,
      order:
        event.activeColumnId && event.direction
          ? [`${event.activeColumnId} ${event.direction.toUpperCase()}`]
          : undefined,
    });
  }

  protected createBankCash(): void {
    void this.router.navigate(['/app/trading/bank-cash/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewBankCash(item: BankCash): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/bank-cash', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editBankCash(item: BankCash): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/bank-cash', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteBankCash(item: BankCash): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/bank-cash', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected handleActionKeydown(
    event: KeyboardEvent,
    item: BankCash,
    action: 'delete' | 'edit' | 'view',
  ): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    if (action === 'delete') {
      this.deleteBankCash(item);
      return;
    }

    if (action === 'edit') {
      this.editBankCash(item);
      return;
    }

    this.viewBankCash(item);
  }

  protected getStatusLabel(status: BankCash['status']): string {
    switch (status) {
      case Status.INACTIVE:
        return 'Inactive';
      case Status.DELETED:
        return 'Deleted';
      case Status.ACTIVE:
      case undefined:
        return 'Active';
      default:
        return String(status);
    }
  }

  protected getStatusTone(status: BankCash['status']): StatusBadgeTone {
    switch (status) {
      case Status.INACTIVE:
        return 'warning';
      case Status.DELETED:
        return 'danger';
      case Status.ACTIVE:
      case undefined:
      default:
        return 'success';
    }
  }

  private buildFilterWhere(): BankCashFilterWhere | undefined {
    const name = this.filterName().trim();
    const description = this.filterDescription().trim();
    const status = this.filterStatus();
    const where: BankCashFilterWhere = {};

    if (name) {
      where['name'] = this.buildTextFilterValue(name, this.filterNameOperator());
    }

    if (description) {
      where['description'] = this.buildTextFilterValue(
        description,
        this.filterDescriptionOperator(),
      );
    }

    if (status !== null) {
      where['status'] = this.buildStatusFilterValue(status, this.filterStatusOperator());
    }

    if (Object.keys(where).length === 0) {
      return undefined;
    }

    return where;
  }

  private buildTextFilterValue(value: string, operator: TextFilterOperator): unknown {
    switch (operator) {
      case '=':
        return { ilike: value };
      case '!=':
        return { neq: value };
      case 'like':
      default:
        return { ilike: `%${value}%` };
    }
  }

  private buildStatusFilterValue(value: Status, operator: StatusFilterOperator): unknown {
    switch (operator) {
      case '!=':
        return { neq: value };
      case '<':
        return { lt: value };
      case '<=':
        return { lte: value };
      case '>':
        return { gt: value };
      case '>=':
        return { gte: value };
      case '=':
      default:
        return value;
    }
  }

  private getCurrentFilter(): BankCashListQuery {
    return this.parseFilter(this.route.snapshot.queryParamMap.get('filter'));
  }

  private async updateFilterInUrl(filter: BankCashListQuery, replaceUrl = false): Promise<void> {
    const normalizedFilter = this.normalizeFilter(filter);
    await this.router.navigate([], {
      queryParams: {
        filter: this.isDefaultFilter(normalizedFilter) ? null : JSON.stringify(normalizedFilter),
      },
      queryParamsHandling: 'merge',
      relativeTo: this.route,
      replaceUrl,
    });
  }

  private normalizeFilter(filter: BankCashListQuery): BankCashListQuery {
    return {
      limit: filter.limit ?? DEFAULT_PAGE_SIZE,
      offset: filter.offset ?? 0,
      ...(filter.order?.length ? { order: filter.order } : {}),
      ...(filter.where ? { where: filter.where } : {}),
    };
  }

  private isDefaultFilter(filter: BankCashListQuery): boolean {
    return (
      (filter.limit ?? DEFAULT_PAGE_SIZE) === DEFAULT_PAGE_SIZE &&
      (filter.offset ?? 0) === 0 &&
      !filter.order?.length &&
      filter.where === undefined
    );
  }

  private parseFilter(filterParam: string | null): BankCashListQuery {
    if (!filterParam) {
      return this.normalizeFilter({});
    }

    try {
      const parsedFilter = JSON.parse(filterParam) as BankCashListQuery;

      return this.normalizeFilter(parsedFilter);
    } catch {
      return this.normalizeFilter({});
    }
  }

  private syncStateFromFilter(filter: BankCashListQuery): void {
    const limit = filter.limit ?? DEFAULT_PAGE_SIZE;
    const offset = filter.offset ?? 0;
    const sort = this.parseSort(filter.order?.[0]);

    this.pageSize.set(limit);
    this.pageIndex.set(Math.floor(offset / limit));
    this.nameFilter.set(this.readTextFilterFromWhere(filter.where, 'name'));
    this.nameFilterOperator.set(this.readTextOperatorFromWhere(filter.where, 'name'));
    this.descriptionFilter.set(this.readTextFilterFromWhere(filter.where, 'description'));
    this.descriptionFilterOperator.set(
      this.readTextOperatorFromWhere(filter.where, 'description'),
    );
    this.statusFilter.set(this.readStatusFilterFromWhere(filter.where));
    this.statusFilterOperator.set(this.readStatusOperatorFromWhere(filter.where));
    this.filterName.set(this.nameFilter());
    this.filterNameOperator.set(this.nameFilterOperator());
    this.filterDescription.set(this.descriptionFilter());
    this.filterDescriptionOperator.set(this.descriptionFilterOperator());
    this.filterStatus.set(this.statusFilter());
    this.filterStatusOperator.set(this.statusFilterOperator());
    this.sortActive.set(sort.active);
    this.sortDirection.set(sort.direction);
  }

  private parseSort(sort: string | undefined): {
    active: string | null;
    direction: TngTableSortDirection | null;
  } {
    if (!sort) {
      return { active: null, direction: null };
    }

    const [active, rawDirection] = sort.split(/\s+/);
    const direction = rawDirection?.toLowerCase();

    if (!active || (direction !== 'asc' && direction !== 'desc')) {
      return { active: null, direction: null };
    }

    return { active, direction };
  }

  private readTextFilterFromWhere(where: BankCashListQuery['where'], field: 'description' | 'name'): string {
    const fieldFilter = where?.[field];

    if (typeof fieldFilter === 'object' && fieldFilter !== null && 'ilike' in fieldFilter) {
      const value = (fieldFilter as { ilike?: unknown }).ilike;

      return typeof value === 'string' ? value.replace(/^%|%$/g, '') : '';
    }

    if (typeof fieldFilter === 'object' && fieldFilter !== null && 'like' in fieldFilter) {
      const value = (fieldFilter as { like?: unknown }).like;

      return typeof value === 'string' ? value.replace(/^%|%$/g, '') : '';
    }

    if (typeof fieldFilter === 'object' && fieldFilter !== null && 'neq' in fieldFilter) {
      const value = (fieldFilter as { neq?: unknown }).neq;

      return typeof value === 'string' ? value : '';
    }

    if (typeof fieldFilter === 'string') {
      return fieldFilter;
    }

    const orFilters = where?.['or'];

    if (!Array.isArray(orFilters)) {
      return '';
    }

    for (const filter of orFilters) {
      const value = this.readTextFilterFromWhere(filter as BankCashListQuery['where'], field);

      if (value) {
        return value.replace(/^%|%$/g, '');
      }
    }

    return '';
  }

  private readTextOperatorFromWhere(
    where: BankCashListQuery['where'],
    field: 'description' | 'name',
  ): TextFilterOperator {
    const fieldFilter = where?.[field];

    if (typeof fieldFilter === 'string') {
      return '=';
    }

    if (typeof fieldFilter === 'object' && fieldFilter !== null) {
      if ('neq' in fieldFilter) {
        return '!=';
      }

      if ('ilike' in fieldFilter || 'like' in fieldFilter) {
        const value = (fieldFilter as { ilike?: unknown; like?: unknown }).ilike
          ?? (fieldFilter as { ilike?: unknown; like?: unknown }).like;

        return typeof value === 'string' && !value.includes('%') ? '=' : 'like';
      }
    }

    return 'like';
  }

  private readStatusFilterFromWhere(where: BankCashListQuery['where']): Status | null {
    const status = where?.['status'];

    if (status === Status.ACTIVE || status === Status.INACTIVE || status === Status.DELETED) {
      return status;
    }

    if (typeof status === 'object' && status !== null) {
      for (const operator of ['neq', 'lt', 'lte', 'gt', 'gte'] as const) {
        const value = (status as Record<string, unknown>)[operator];

        if (value === Status.ACTIVE || value === Status.INACTIVE || value === Status.DELETED) {
          return value;
        }
      }
    }

    return null;
  }

  private readStatusOperatorFromWhere(where: BankCashListQuery['where']): StatusFilterOperator {
    const status = where?.['status'];

    if (typeof status !== 'object' || status === null) {
      return '=';
    }

    if ('neq' in status) {
      return '!=';
    }

    if ('lt' in status) {
      return '<';
    }

    if ('lte' in status) {
      return '<=';
    }

    if ('gt' in status) {
      return '>';
    }

    if ('gte' in status) {
      return '>=';
    }

    return '=';
  }
}
