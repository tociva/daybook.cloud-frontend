import { Component, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { DbcError } from '../../../../util/types/dbc-error.type';
import { FileUploadComponent } from '../../file-upload/file-upload.component';

@Component({
  selector: 'app-item-landing-header',
  imports: [NgIcon, FileUploadComponent],
  templateUrl: './item-landing-header.html',
  styleUrl: './item-landing-header.css'
})
export class ItemLandingHeader {

  readonly title = input<string>('');
  readonly error = input<DbcError | null>(null);
  readonly createButtonText = input<string>('Create new item');
  readonly onCreateItem = input<() => void>(() => {
    return void 0;
  });
  readonly button2Caption = input<string | null>(null);
  readonly onButton2Click = input<() => void>(() => {
    return void 0;
  });
  readonly bulkUploadLabel = input<string | null>(null);
  readonly bulkUploadHint = input<string | null>(null);
  readonly bulkUploadAccept = input<string>('*');
  readonly bulkUploadMultiple = input<boolean>(false);
  readonly bulkUploadSizeClass = input<string>('w-full h-12');
  // Output
  readonly filesSelected = output<File[]>();

  handleFilesSelected(files: File[]) {
    this.filesSelected.emit(files);
  }
}
