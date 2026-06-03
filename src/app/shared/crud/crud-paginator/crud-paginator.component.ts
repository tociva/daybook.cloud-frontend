import {
  Component,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TngPaginator } from '@tailng-ui/components';
import type { Lb4ListQuery } from '../lb4-query';
import { DEFAULT_LB4_PAGE_SIZE, normalizeLb4Filter } from '../lb4-query';
import { CrudUrlService } from '../crud-url.service';

@Component({
  selector: 'app-crud-paginator',
  imports: [TngPaginator],
  templateUrl: './crud-paginator.component.html',
  styleUrl: './crud-paginator.component.css',
})
export class CrudPaginatorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly crudUrl = inject(CrudUrlService);
  private readonly inferredUnfilteredTotalItems = signal<number | null>(null);

  readonly ariaLabel = input('Pagination');
  readonly defaultPageSize = input(DEFAULT_LB4_PAGE_SIZE);
  readonly filter = input<Lb4ListQuery>({});
  readonly maxPageButtons = input(3);
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50]);
  readonly showFirstLast = input(true);
  readonly showPageSize = input(true);
  readonly showRange = input(true);
  readonly replaceUrl = input(false, { transform: booleanAttribute });
  readonly syncUrl = input(false, { transform: booleanAttribute });
  readonly totalItems = input(0);
  readonly unfilteredTotalItems = input<number | null>(null);

  readonly filterChange = output<Lb4ListQuery>();

  protected readonly pageIndex = computed(() => {
    const filter = this.normalizedFilter();
    const limit = filter.limit ?? this.defaultPageSize();
    const offset = filter.offset ?? 0;

    return Math.floor(offset / limit);
  });

  protected readonly pageSize = computed(
    () => this.normalizedFilter().limit ?? this.defaultPageSize(),
  );
  protected readonly hasActiveWhere = computed(
    () => Object.keys(this.normalizedFilter().where ?? {}).length > 0,
  );

  protected readonly rangeLabel = computed(() => {
    const totalItems = Math.max(0, this.totalItems());
    const pageSize = Math.max(1, this.pageSize());
    const pageIndex = Math.max(0, this.pageIndex());

    if (totalItems === 0) {
      return this.filteredFromSuffix('0 of 0');
    }

    const start = Math.min(pageIndex * pageSize + 1, totalItems);
    const end = Math.min(totalItems, start + pageSize - 1);

    return this.filteredFromSuffix(`${start} - ${end} of ${totalItems}`);
  });

  constructor() {
    effect(() => {
      if (!this.hasActiveWhere()) {
        this.inferredUnfilteredTotalItems.set(Math.max(0, this.totalItems()));
      }
    });
  }

  protected onPageIndexChange(pageIndex: number): void {
    const limit = this.pageSize();

    void this.emitFilterChange({
      ...this.normalizedFilter(),
      limit,
      offset: pageIndex * limit,
    });
  }

  protected onPageSizeChange(pageSize: number): void {
    void this.emitFilterChange({
      ...this.normalizedFilter(),
      limit: pageSize,
      offset: 0,
    });
  }

  private async emitFilterChange(filter: Lb4ListQuery): Promise<void> {
    this.filterChange.emit(filter);

    if (!this.syncUrl()) {
      return;
    }

    await this.crudUrl.updateFilterInUrl(filter, {
      defaultPageSize: this.defaultPageSize(),
      replaceUrl: this.replaceUrl(),
      route: this.route,
    });
  }

  private normalizedFilter(): Lb4ListQuery {
    return normalizeLb4Filter(this.filter(), this.defaultPageSize());
  }

  private filteredFromSuffix(label: string): string {
    const unfilteredTotalItems =
      this.unfilteredTotalItems() ?? this.inferredUnfilteredTotalItems();

    if (!this.hasActiveWhere()) return label;
    if (unfilteredTotalItems === null) return `${label} filtered`;

    return `${label} filtered (${unfilteredTotalItems} total)`;
  }
}
