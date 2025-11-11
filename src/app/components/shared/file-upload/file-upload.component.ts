// src/app/shared/file-upload/file-upload.component.ts
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {input, output} from '@angular/core';
import {NgClass} from '@angular/common';
import {FileUploadDirective} from './file-upload.directive';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [NgClass, FileUploadDirective, NgIcon],
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
  bulkUploadSampleFileUrl = input<string | null>(null);

  // Parent can override, e.g. "w-full h-48", "w-64 h-32"
  sizeClass = input('w-full h-40');

  // Output
  filesSelected = output<File[]>();

  handleFiles(files: File[]) {
    this.filesSelected.emit(files);
  }
  downloadSample(event: MouseEvent): void {
    event.stopPropagation(); // prevent triggering upload
  
    const link = document.createElement('a');
    link.href = this.bulkUploadSampleFileUrl() ?? ''; // or '/sample-file.csv' if using public folder
    link.download = this.bulkUploadSampleFileUrl() ?? '';
    link.click();
  }
  
}
