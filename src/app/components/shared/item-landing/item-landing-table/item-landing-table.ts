import { NgClass } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { DbcColumn } from '../../../../util/types/dbc-column.type';
import { DbcError } from '../../../../util/types/dbc-error.type';
import { EmptyListMessage } from '../../../../util/types/empty-list-message.type';
import { Status } from '../../../../util/types/status.type';

type SortDirection = 'asc' | 'desc' | null;

@Component({
  selector: 'app-item-landing-table',
  imports: [NgClass, NgIcon],
  templateUrl: './item-landing-table.html',
  styleUrl: './item-landing-table.css'
})
export class ItemLandingTable<T> {

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
  protected sortColumn = signal<keyof T | string | null>(null);
  protected sortDirection = signal<SortDirection>(null);

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
    
    const currentColumn = this.sortColumn();
    const currentDirection = this.sortDirection();
    
    if (currentColumn === column.key) {
      // Same column - cycle through directions
      if (currentDirection === 'asc') {
        this.sortDirection.set('desc');
      } else if (currentDirection === 'desc') {
        this.sortDirection.set(null);
        this.sortColumn.set(null);
      } else {
        this.sortDirection.set('asc');
      }
    } else {
      // New column - start with ascending
      this.sortColumn.set(column.key);
      this.sortDirection.set('asc');
    }
    
    console.log('Sort clicked:', {
      column: column.key,
      header: column.header,
      type: column.type,
      direction: this.sortDirection()
    });
  }
  
  // Get sort icon name
  protected getSortIcon(column: DbcColumn<T>): string {
    if (!column.sortable) return '';
    
    const currentColumn = this.sortColumn();
    const currentDirection = this.sortDirection();
    
    if (currentColumn !== column.key) {
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
