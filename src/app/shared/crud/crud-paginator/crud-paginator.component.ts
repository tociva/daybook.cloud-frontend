import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TngPaginator } from '@tailng-ui/components';
import type { Lb4ListQuery } from '../lb4-query';
import { DEFAULT_LB4_PAGE_SIZE, normalizeLb4Filter } from '../lb4-query';

@Component({
  selector: 'app-crud-paginator',
  imports: [TngPaginator],
  templateUrl: './crud-paginator.component.html',
  styleUrl: './crud-paginator.component.css',
})
export class CrudPaginatorComponent {
  @Input() ariaLabel = 'Pagination';
  @Input() defaultPageSize = DEFAULT_LB4_PAGE_SIZE;
  @Input() filter: Lb4ListQuery = {};
  @Input() maxPageButtons = 3;
  @Input() pageSizeOptions: readonly number[] = [10, 25, 50];
  @Input() showFirstLast = false;
  @Input() showPageSize = true;
  @Input() showRange = true;
  @Input() totalItems = 0;

  @Output() readonly filterChange = new EventEmitter<Lb4ListQuery>();

  protected get pageIndex(): number {
    const filter = this.normalizedFilter();
    const limit = filter.limit ?? this.defaultPageSize;
    const offset = filter.offset ?? 0;

    return Math.floor(offset / limit);
  }

  protected get pageSize(): number {
    return this.normalizedFilter().limit ?? this.defaultPageSize;
  }

  protected onPageIndexChange(pageIndex: number): void {
    const limit = this.pageSize;

    this.filterChange.emit({
      ...this.normalizedFilter(),
      limit,
      offset: pageIndex * limit,
    });
  }

  protected onPageSizeChange(pageSize: number): void {
    this.filterChange.emit({
      ...this.normalizedFilter(),
      limit: pageSize,
      offset: 0,
    });
  }

  private normalizedFilter(): Lb4ListQuery {
    return normalizeLb4Filter(this.filter, this.defaultPageSize);
  }
}
