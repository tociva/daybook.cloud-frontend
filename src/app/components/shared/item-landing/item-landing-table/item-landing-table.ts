import { NgClass } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { DbcColumn } from '../../../../util/types/dbc-column.type';
import { DbcError } from '../../../../util/types/dbc-error.type';
import { EmptyListMessage } from '../../../../util/types/empty-list-message.type';
import { Status } from '../../../../util/types/status.type';
import { findQueryParamsOriginal, updateUrlParams } from '../../../../util/query-params-util';
import { ActivatedRoute, Router } from '@angular/router';

type SortDirection = 'asc' | 'desc' | null;

@Component({
  selector: 'app-item-landing-table',
  imports: [NgClass, NgIcon],
  templateUrl: './item-landing-table.html',
  styleUrl: './item-landing-table.css'
})
export class ItemLandingTable<T> {

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly items = input<T[] | null>(null);
  readonly columns = input<DbcColumn<T>[]>([]);
  readonly error = input<DbcError | null>(null);
  readonly onEditItem = input<(item: T) => void>();
  readonly onDeleteItem = input<(item: T) => void>();
  readonly emptyListMessage = input<EmptyListMessage>({
    title: 'No items found',
    description: 'Get started by creating your first item.',
    buttonText: 'Create First Item'
  });
  readonly onRetry = input<() => void>(() => {
    return void 0;
  });
  readonly onCreateItem = input<() => void>(() => {
    return void 0;
  });

  // Sorting state
  private sortColumnDetails: Partial<Record<keyof T | string, SortDirection>> = {};

  findValue(item: T, column: DbcColumn<T>): any {
    return item[column.key as keyof T];
  }
  findTrackValue(item: T): string {
    const idItem = item as unknown as { id: string };
    return idItem.id;
  }
  isActive(item: T): boolean {
    const status = item as unknown as { status: Status };
    return status.status === Status.ACTIVE;
  }

  protected onSort(column: DbcColumn<T>): void {
    if (!column.sortable) return;
    
    const {key} = column;
    const sortDetails = this.sortColumnDetails[key];
    
    if (sortDetails) {
      // Same column - cycle through directions
      if (sortDetails === 'asc') {
        this.sortColumnDetails[key] = 'desc';
      } else if (sortDetails === 'desc') {
        this.sortColumnDetails[key] = null;
      } else {
        this.sortColumnDetails[key] = 'asc';
      }
    } else {
      // New column - start with ascending
      this.sortColumnDetails[key] = 'asc';
    }
    const queryParams = findQueryParamsOriginal(this.route);
    const {sort:sortQueryParam} = queryParams;
    if(sortQueryParam) {
      const sorts = sortQueryParam.split(',');
      const prevSort = sorts.find(sort => sort.startsWith(`${String(column.key)}:`));
      if(prevSort) {
        if(this.sortColumnDetails[key]) {
          sorts.splice(sorts.indexOf(prevSort), 1, `${String(column.key)}:${this.sortColumnDetails[key]}`);
        } else {
          sorts.splice(sorts.indexOf(prevSort), 1);
        }
      } else {
        sorts.push(`${String(column.key)}:${this.sortColumnDetails[key]}`);
      }
      const sort = sorts.length > 0 ? sorts.join(',') : null;
      updateUrlParams(this.router, this.route, { sort });
    } else {
      const sort = `${String(column.key)}:${this.sortColumnDetails[key]}`;
      updateUrlParams(this.router, this.route, { sort });
    }
    
  }
  
  // Get sort icon name
  protected getSortIcon(column: DbcColumn<T>): string {
    if (!column.sortable) return '';
    
    const currentDirection = this.sortColumnDetails[column.key];

    if (!currentDirection) {
      return 'bootstrapArrowsExpand'; // no-sort state
    }
    
    switch (currentDirection) {
      case 'asc':
        return 'bootstrapSortUp';
      case 'desc':
        return 'bootstrapSortDown';
      default:
        return 'bootstrapArrowsExpand';
    }
  }
}
