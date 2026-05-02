import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  DEFAULT_LB4_PAGE_SIZE,
  applyLb4SortChange,
  normalizeLb4Filter,
  parseLb4FilterParam,
  parseLb4SortState,
} from './lb4-query';
import type { Lb4ListQuery, Lb4SortChange } from './lb4-query';
import { CrudUrlService } from './crud-url.service';

export type CrudListQueryOptions = Readonly<{
  defaultPageSize?: number;
  pageSizeOptions?: readonly number[];
  queryParamName?: string;
}>;

@Injectable()
export class CrudListQueryService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly crudUrl = inject(CrudUrlService);
  private defaultPageSize = DEFAULT_LB4_PAGE_SIZE;
  private queryParamName = 'filter';

  readonly filter = signal<Lb4ListQuery>(normalizeLb4Filter({}));
  readonly pageSizeOptions = signal<readonly number[]>([10, 25, 50]);
  readonly sortState = computed(() => parseLb4SortState(this.filter().order));
  readonly sortActive = computed(() => this.sortState().active);
  readonly sortDirection = computed(() => this.sortState().direction);

  init(
    onFilterChange: (filter: Lb4ListQuery) => Promise<void> | void,
    options: CrudListQueryOptions = {},
  ): void {
    this.defaultPageSize = options.defaultPageSize ?? DEFAULT_LB4_PAGE_SIZE;
    this.queryParamName = options.queryParamName ?? 'filter';
    this.pageSizeOptions.set(options.pageSizeOptions ?? [10, 25, 50]);

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const filter = parseLb4FilterParam(params.get(this.queryParamName), this.defaultPageSize);
      const normalizedFilter = normalizeLb4Filter(filter, this.defaultPageSize);

      this.filter.set(normalizedFilter);
      void onFilterChange(normalizedFilter);
    });
  }

  async applySort(sort: Lb4SortChange): Promise<void> {
    await this.crudUrl.updateFilterInUrl(applyLb4SortChange(this.getCurrentFilter(), sort), {
      defaultPageSize: this.defaultPageSize,
      queryParamName: this.queryParamName,
      route: this.route,
    });
  }

  private getCurrentFilter(): Lb4ListQuery {
    return parseLb4FilterParam(
      this.route.snapshot.queryParamMap.get(this.queryParamName),
      this.defaultPageSize,
    );
  }
}
