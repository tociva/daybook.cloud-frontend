import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { DbcError } from '../../../util/types/dbc-error.type';
import { EmptyListMessage } from '../../../util/types/empty-list-message.type';
import { DbcColumn } from '../../../util/types/dbc-column.type';
import { Status } from '../../../util/types/status.type';

@Component({
  selector: 'app-item-landing',
  imports: [NgIcon, NgClass],
  templateUrl: './item-landing.html',
  styleUrl: './item-landing.css'
})
export class ItemLanding<T> {

  readonly title = input<string>('');
  readonly items = input<T[] | null>(null);
  readonly error = input<DbcError | null>(null);
  readonly createButtonText = input<string>('Create new item');
  readonly emptyListMessage = input<EmptyListMessage>({
    title: 'No items found',
    description: 'Get started by creating your first item.',
    buttonText: 'Create First Item'
  });

  readonly columns = input<DbcColumn<T>[]>([]);

  readonly onCreateItem = input<() => void>(() => {
    return void 0;
  });

  readonly onRetry = input<() => void>(() => {
    return void 0;
  });

  readonly onEditItem = input<(item: T) => void>();
  readonly onDeleteItem = input<(item: T) => void>();

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
