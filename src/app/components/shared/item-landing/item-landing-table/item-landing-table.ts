import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { DbcColumn } from '../../../../util/types/dbc-column.type';
import { Status } from '../../../../util/types/status.type';
import { NgIcon } from '@ng-icons/core';
import { EmptyListMessage } from '../../../../util/types/empty-list-message.type';
import { DbcError } from '../../../../util/types/dbc-error.type';

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
}
