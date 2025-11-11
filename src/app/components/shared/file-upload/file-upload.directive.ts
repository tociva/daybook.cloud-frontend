// src/app/shared/file-upload.directive.ts
import {
  Directive,
  ElementRef,
  inject,
  HostListener,
  OnDestroy,
} from '@angular/core';
import {input, output, signal, effect} from '@angular/core';

@Directive({
  selector: '[appFileUpload]',
  standalone: true,
  host: {
    'tabindex': '0',
    'role': 'button',
    '[class.file-upload-dragover]': 'isDragOver()',
  },
})
export class FileUploadDirective implements OnDestroy {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private fileInput: HTMLInputElement;
  private changeHandler = () => this.handleInputChange();

  accept = input<string | undefined>(undefined, {alias: 'fileUploadAccept'});
  multiple = input(false, {alias: 'fileUploadMultiple'});
  disabled = input(false, {alias: 'fileUploadDisabled'});

  files = output<File[]>({alias: 'fileUploadFiles'});

  isDragOver = signal(false);

  constructor() {
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.style.display = 'none';

    this.host.nativeElement.appendChild(this.fileInput);
    this.fileInput.addEventListener('change', this.changeHandler);

    effect(() => {
      const a = this.accept();
      if (a) this.fileInput.accept = a;
      else this.fileInput.removeAttribute('accept');
    });

    effect(() => {
      this.fileInput.multiple = this.multiple();
    });
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.disabled()) return;
    event.stopPropagation();
    this.fileInput.click();
  }

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    if (this.disabled()) return;
    this.fileInput.click();
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.isDragOver.set(true);
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  @HostListener('dragleave')
  @HostListener('dragend')
  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.isDragOver.set(false);

    const dt = event.dataTransfer;
    if (!dt?.files?.length) return;

    const files = this.filterFiles(dt.files);
    if (files.length) this.files.emit(files);
  }

  ngOnDestroy(): void {
    this.fileInput.removeEventListener('change', this.changeHandler);
    if (this.fileInput.parentNode) {
      this.fileInput.parentNode.removeChild(this.fileInput);
    }
  }

  private handleInputChange(): void {
    const files = this.filterFiles(this.fileInput.files);
    if (files.length) this.files.emit(files);
    this.fileInput.value = '';
  }

  private filterFiles(fileList: FileList | null): File[] {
    if (!fileList) return [];
    let files = Array.from(fileList);

    if (!this.multiple() && files.length > 1) {
      files = [files[0]];
    }

    const accept = this.accept();
    if (!accept) return files;

    const patterns = accept
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter(Boolean);

    if (!patterns.length) return files;

    return files.filter(file => {
      const name = file.name.toLowerCase();
      const type = file.type.toLowerCase();
      return patterns.some(p => {
        if (p.startsWith('.')) return name.endsWith(p);
        if (p.endsWith('/*')) {
          const base = p.replace('/*', '');
          return type.startsWith(base);
        }
        return type === p;
      });
    });
  }
}
