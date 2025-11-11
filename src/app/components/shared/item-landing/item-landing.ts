import { Component, input, output } from '@angular/core';
import { DbcColumn } from '../../../util/types/dbc-column.type';
import { DbcError } from '../../../util/types/dbc-error.type';
import { EmptyListMessage } from '../../../util/types/empty-list-message.type';
import { ItemLandingHeader } from './item-landing-header/item-landing-header';
import { ItemLandingTable } from './item-landing-table/item-landing-table';
import { ItemLandingPaginator } from './item-landing-paginator/item-landing-paginator';

@Component({
  selector: 'app-item-landing',
  imports: [ItemLandingHeader, ItemLandingTable, ItemLandingPaginator],
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
  readonly count = input<number>(0);
  readonly pageSize = input<number>(10);
  readonly currentPage = input<number>(1);

  readonly columns = input<DbcColumn<T>[]>([]);

  readonly onCreateItem = input<() => void>(() => {
    return void 0;
  });

  readonly onRetry = input<() => void>(() => {
    return void 0;
  });

  readonly onEditItem = input<(item: T) => void>();
  readonly onDeleteItem = input<(item: T) => void>();

  readonly button2Caption = input<string | null>(null);
  readonly onButton2Click = input<() => void>(() => {
    return void 0;
  });

  readonly bulkUploadLabel = input<string | null>(null);
  readonly bulkUploadHint = input<string | null>(null);
  readonly filesSelected = output<File[]>();

  readonly bulkUploadAccept = input<string>('*');
  readonly bulkUploadMultiple = input<boolean>(false);
  readonly bulkUploadSizeClass = input<string>('w-full h-12');

  handleOnFilesSelected(files: File[]) {
    this.filesSelected.emit(files);
  }
}
