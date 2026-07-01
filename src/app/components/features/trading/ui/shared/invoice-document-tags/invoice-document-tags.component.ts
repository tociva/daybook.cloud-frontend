import { Component, computed, inject, input, output, signal } from '@angular/core';
import { TngButtonComponent, TngTag, TngTooltipComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import {
  documentPermission,
  type DocumentPermissionResource,
} from '../../../../../../core/permissions/permission-requirements';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import {
  getDownloadErrorMessage,
  startSignedDownload,
} from '../../../../../../shared/file/signed-url-download.service';
import { InvoiceDocumentService, type StoredDocument } from '../../../data/invoice-document';

@Component({
  selector: 'app-invoice-document-tags',
  standalone: true,
  imports: [TngButtonComponent, TngIcon, TngTag, TngTooltipComponent],
  templateUrl: './invoice-document-tags.component.html',
  styleUrl: './invoice-document-tags.component.css',
})
export class InvoiceDocumentTagsComponent {
  private readonly permissionsStore = inject(PermissionsStore);
  private readonly toastStore = inject(ToastStore);
  private readonly documentService = inject(InvoiceDocumentService);

  readonly documents = input<readonly StoredDocument[]>([]);
  readonly files = input<readonly File[]>([]);
  readonly resourceType = input<DocumentPermissionResource | null>(null);
  readonly parentId = input<string | null>(null);
  readonly editable = input(false);
  readonly disabled = input(false);
  readonly uploading = input(false);
  readonly filesChange = output<readonly File[]>();
  readonly documentRemove = output<StoredDocument>();

  protected readonly inputId = `invoice-document-tags-${Math.random().toString(36).slice(2)}`;
  protected readonly downloadingDocumentIds = signal<ReadonlySet<string>>(new Set());

  protected readonly canAttach = computed(() => {
    const resourceType = this.resourceType();
    return resourceType
      ? this.permissionsStore.can(documentPermission(resourceType, 'create'))
      : false;
  });
  protected readonly canDelete = computed(() => {
    const resourceType = this.resourceType();
    return resourceType
      ? this.permissionsStore.can(documentPermission(resourceType, 'delete'))
      : false;
  });
  protected readonly canDownload = computed(() => {
    const resourceType = this.resourceType();
    return resourceType
      ? this.permissionsStore.can(documentPermission(resourceType, 'view'))
      : false;
  });

  protected readonly isDisabled = computed(() => this.disabled() || this.uploading());

  protected readonly hasAttachments = computed(
    () => this.documents().length > 0 || this.files().length > 0,
  );

  protected browse(): void {
    if (!this.editable() || this.isDisabled() || !this.canAttach()) return;
    document.getElementById(this.inputId)?.click();
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.browse();
  }

  protected onBrowse(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    this.addFiles(Array.from(inputEl.files ?? []));
    inputEl.value = '';
  }

  protected removeFile(file: File, event?: Event): void {
    event?.stopPropagation();
    if (this.isDisabled() || !this.canAttach()) return;
    this.filesChange.emit(this.files().filter((item) => item !== file));
  }

  protected removeDocument(document: StoredDocument, event?: Event): void {
    event?.stopPropagation();
    if (this.isDisabled() || !this.canDelete()) return;
    this.documentRemove.emit(document);
  }

  protected async downloadDocument(document: StoredDocument, event: Event): Promise<void> {
    event.stopPropagation();
    const resourceType = this.resourceType();
    const parentId = this.parentId();
    const documentId = document.id;
    if (
      !resourceType ||
      !parentId ||
      !documentId ||
      !this.canDownload() ||
      this.downloadingDocumentIds().has(documentId)
    ) return;

    this.setDocumentDownloading(documentId, true);
    try {
      const response = await this.documentService.getDownloadUrl(
        resourceType,
        parentId,
        documentId,
      );
      startSignedDownload(response);
    } catch (error) {
      this.toastStore.danger(getDownloadErrorMessage(error, 'Failed to download document.'));
    } finally {
      this.setDocumentDownloading(documentId, false);
    }
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

  private setDocumentDownloading(documentId: string, downloading: boolean): void {
    this.downloadingDocumentIds.update((current) => {
      const next = new Set(current);
      if (downloading) next.add(documentId);
      else next.delete(documentId);
      return next;
    });
  }

  protected documentDetails(document: StoredDocument): string {
    return `${document.name} - ${this.formatFileSize(document.size)} - ${this.documentType(document)}`;
  }

  protected documentType(document: StoredDocument): string {
    return document.props?.mimeType ?? document.type ?? 'Unknown type';
  }

  protected trackDocument(_index: number, document: StoredDocument): string {
    return document.id ?? document.path ?? `${document.name}-${document.size}`;
  }

  protected fileDetails(file: File): string {
    const type = file.type || 'Unknown type';
    return `${file.name} - ${this.formatFileSize(file.size)} - ${type}`;
  }

  protected trackFile(_index: number, file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  private addFiles(nextFiles: readonly File[]): void {
    if (this.isDisabled() || !this.canAttach() || !nextFiles.length) return;

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
