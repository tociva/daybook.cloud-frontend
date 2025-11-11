// src/app/shared/file-upload/file-upload.component.ts
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {input, output} from '@angular/core';
import {NgClass} from '@angular/common';
import {FileUploadDirective} from './file-upload.directive';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [NgClass, FileUploadDirective],
  templateUrl: './file-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadComponent {
  // Inputs
  accept = input.required<string>();
  multiple = input(false);
  disabled = input(false);
  label = input<string | null>(null);
  hint = input<string | null>(null);

  // Parent can override, e.g. "w-full h-48", "w-64 h-32"
  sizeClass = input('w-full h-40');

  // Output
  filesSelected = output<File[]>();

  handleFiles(files: File[]) {
    this.filesSelected.emit(files);
  }
}
