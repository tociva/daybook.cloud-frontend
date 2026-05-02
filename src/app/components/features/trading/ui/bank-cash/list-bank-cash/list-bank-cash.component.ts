import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngTag,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import type { TngTableSortDirection } from '@tailng-ui/cdk';
import { TngIcon } from '@tailng-ui/icons';
import {
  CrudFilterPopoverComponent,
  CrudPaginatorComponent,
  DEFAULT_LB4_PAGE_SIZE,
  parseLb4FilterParam,
  serializeLb4FilterForUrl,
} from '../../../../../../shared/crud';
import type { CrudFilterField, Lb4Where } from '../../../../../../shared/crud';
import { BankCashStore, Status } from '../../../data/bank-cash';
import type { BankCash, BankCashListQuery } from '../../../data/bank-cash';
import { TngTagIcon } from '../tng-tag-icon.directive';

type StatusBadgeTone = 'danger' | 'success' | 'warning';

const DEFAULT_PAGE_SIZE = DEFAULT_LB4_PAGE_SIZE;

@Component({
  selector: 'app-list-bank-cash',
  imports: [
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
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
  protected readonly currentFilter = signal<BankCashListQuery>({});
  protected readonly currentWhere = signal<Lb4Where | undefined>(undefined);
  protected readonly hasError = computed(() => this.bankCashStore.error() !== null);
  protected readonly pageSizeOptions = [10, 25, 50] as const;
  protected readonly sortActive = signal<string | null>(null);
  protected readonly sortDirection = signal<TngTableSortDirection | null>(null);
  protected readonly columns: readonly TngTableColumn<BankCash>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '18rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'status', label: 'Status', sortable: true, width: '9rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];
  protected readonly filterFields: readonly CrudFilterField[] = [
    {
      id: 'name',
      label: 'Name',
      placeholder: 'Account name',
      type: 'text',
    },
    {
      id: 'description',
      label: 'Description',
      placeholder: 'Description',
      type: 'text',
    },
    {
      id: 'status',
      label: 'Status',
      options: [
        { label: 'Active', value: Status.ACTIVE },
        { label: 'Inactive', value: Status.INACTIVE },
        { label: 'Deleted', value: Status.DELETED },
      ],
      placeholder: 'Any status',
      type: 'enum',
    },
  ];

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const filter = this.parseFilter(params.get('filter'));
      this.syncStateFromFilter(filter);
      void this.bankCashStore.loadBankCashes(filter);
    });
  }

  protected async applyFilters(where: Lb4Where | undefined): Promise<void> {
    await this.updateFilterInUrl({
      ...this.getCurrentFilter(),
      offset: 0,
      where,
    });
  }

  protected async clearFilter(): Promise<void> {
    await this.updateFilterInUrl({
      ...this.getCurrentFilter(),
      offset: 0,
      where: undefined,
    });
  }

  protected async onPaginationFilterChange(filter: BankCashListQuery): Promise<void> {
    await this.updateFilterInUrl(filter);
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

  private getCurrentFilter(): BankCashListQuery {
    return parseLb4FilterParam(this.route.snapshot.queryParamMap.get('filter'), DEFAULT_PAGE_SIZE);
  }

  private async updateFilterInUrl(filter: BankCashListQuery, replaceUrl = false): Promise<void> {
    await this.router.navigate([], {
      queryParams: {
        filter: serializeLb4FilterForUrl(filter, DEFAULT_PAGE_SIZE),
      },
      queryParamsHandling: 'merge',
      relativeTo: this.route,
      replaceUrl,
    });
  }

  private parseFilter(filterParam: string | null): BankCashListQuery {
    return parseLb4FilterParam(filterParam, DEFAULT_PAGE_SIZE);
  }

  private syncStateFromFilter(filter: BankCashListQuery): void {
    const limit = filter.limit ?? DEFAULT_PAGE_SIZE;
    const offset = filter.offset ?? 0;
    const sort = this.parseSort(filter.order?.[0]);

    this.currentFilter.set({ ...filter, limit, offset });
    this.currentWhere.set(filter.where);
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
}
