import { Component, computed, inject, input, output } from '@angular/core';
import { TngButtonComponent, TngTag, TngTooltipComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import {
  documentPermission,
  type DocumentPermissionResource,
} from '../../../../../../core/permissions/permission-requirements';
import { ToastStore } from '../../../../../../core/toast/toast.store';

@Component({
  selector: 'app-invoice-document-picker',
  imports: [TngButtonComponent, TngIcon, TngTag, TngTooltipComponent],
  templateUrl: './invoice-document-picker.component.html',
  styleUrl: './invoice-document-picker.component.css',
})
export class InvoiceDocumentPickerComponent {
  private readonly permissionsStore = inject(PermissionsStore);
  private readonly toastStore = inject(ToastStore);

  readonly files = input<readonly File[]>([]);
  readonly resourceType = input.required<DocumentPermissionResource>();
  readonly disabled = input(false);
  readonly uploading = input(false);
  readonly filesChange = output<readonly File[]>();

  protected readonly inputId = `invoice-document-picker-${Math.random().toString(36).slice(2)}`;

  protected readonly canAttach = computed(() => {
    return this.permissionsStore.can(documentPermission(this.resourceType(), 'createDocument'));
  });

  protected readonly isDisabled = computed(
    () => this.disabled() || this.uploading() || !this.canAttach(),
  );

  protected browse(): void {
    if (this.isDisabled()) return;
    document.getElementById(this.inputId)?.click();
  }

  protected onBrowse(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    this.addFiles(Array.from(inputEl.files ?? []));
    inputEl.value = '';
  }

  protected removeFile(file: File, event?: Event): void {
    event?.stopPropagation();
    if (this.isDisabled()) return;
    this.filesChange.emit(this.files().filter((item) => item !== file));
  }

  protected formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'] as const;
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
  }

  protected fileDetails(file: File): string {
    const type = file.type || 'Unknown type';
    return `${file.name} - ${this.formatFileSize(file.size)} - ${type}`;
  }

  protected trackFile(_index: number, file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  private addFiles(nextFiles: readonly File[]): void {
    if (this.isDisabled() || !nextFiles.length) return;

    const validFiles = nextFiles.filter((file) => file.size > 0);
    if (validFiles.length !== nextFiles.length) {
      this.toastStore.warning('Empty files were skipped.');
    }
    if (!validFiles.length) return;

    const existing = this.files();
    const merged = [...existing];
    for (const file of validFiles) {
      const isDuplicate = merged.some(
        (item) =>
          item.name === file.name &&
          item.size === file.size &&
          item.lastModified === file.lastModified,
      );
      if (!isDuplicate) merged.push(file);
    }

    this.filesChange.emit(merged);
  }
}
