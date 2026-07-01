import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { TngButtonComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import {
  TngFileUploadDirective,
  type TngFileUploadRejectedEvent,
  type TngFileUploadSelectedEvent,
} from '@tailng-ui/primitives';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import { documentPermission } from '../../../../../../core/permissions/permission-requirements';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import {
  getDownloadErrorMessage,
  startSignedDownload,
} from '../../../../../../shared/file/signed-url-download.service';
import {
  InvoiceDocumentService,
  type InvoiceDocumentResourceType,
  type StoredDocument,
} from '../../../data/invoice-document';

type UploadStatus = 'creating' | 'uploading' | 'failed';

type UploadEntry = Readonly<{
  key: string;
  file: File;
  progress: number;
  status: UploadStatus;
  message?: string;
}>;

@Component({
  selector: 'app-invoice-attachments',
  imports: [TngButtonComponent, TngIcon, TngFileUploadDirective, EmptyStateComponent],
  templateUrl: './invoice-attachments.component.html',
  styleUrl: './invoice-attachments.component.css',
})
export class InvoiceAttachmentsComponent {
  private readonly documentService = inject(InvoiceDocumentService);
  private readonly permissionsStore = inject(PermissionsStore);
  private readonly toastStore = inject(ToastStore);

  readonly resourceType = input.required<InvoiceDocumentResourceType>();
  readonly parentId = input.required<string>();
  readonly documents = input<readonly StoredDocument[] | null | undefined>([]);
  readonly documentsChanged = output<readonly StoredDocument[]>();

  protected readonly inputId = `invoice-attachments-${Math.random().toString(36).slice(2)}`;
  protected readonly localDocuments = signal<readonly StoredDocument[]>([]);
  protected readonly uploadEntries = signal<readonly UploadEntry[]>([]);
  protected readonly deletingDocumentId = signal<string | null>(null);
  protected readonly downloadingDocumentIds = signal<ReadonlySet<string>>(new Set());
  protected readonly isUploading = signal(false);

  protected readonly isBusy = computed(
    () => this.isUploading() || this.deletingDocumentId() !== null,
  );
  protected readonly canAttach = computed(() => this.hasPermission('create'));
  protected readonly canDelete = computed(() => this.hasPermission('delete'));
  protected readonly canDownload = computed(() => this.hasPermission('view'));

  constructor() {
    effect(() => {
      this.localDocuments.set([...(this.documents() ?? [])]);
    });
  }

  protected chooseFiles(): void {
    if (this.isBusy() || !this.canAttach()) return;
    document.getElementById(this.inputId)?.click();
  }

  protected async onBrowse(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const files = Array.from(inputEl.files ?? []);
    inputEl.value = '';
    await this.uploadFiles(files);
  }

  protected async onFilesSelected(event: TngFileUploadSelectedEvent): Promise<void> {
    await this.uploadFiles(event.files);
  }

  protected async onFilesRejected(event: TngFileUploadRejectedEvent): Promise<void> {
    const first = event.rejected[0];
    this.toastStore.warning(first?.message ?? 'Some files could not be attached.');
    if (event.accepted.length) {
      await this.uploadFiles(event.accepted);
    }
  }

  private async uploadFiles(files: readonly File[]): Promise<void> {
    if (!files.length || this.isBusy() || !this.canAttach()) return;

    const validFiles = files.filter((file) => file.size > 0);
    const emptyFiles = files.filter((file) => file.size <= 0);
    if (emptyFiles.length) {
      this.toastStore.warning('Empty files were skipped.');
    }
    if (!validFiles.length) {
      this.toastStore.danger('Select at least one non-empty file to attach.');
      return;
    }

    this.isUploading.set(true);
    this.uploadEntries.set(validFiles.map((file) => this.createUploadEntry(file)));

    try {
      const createdDocuments = await this.documentService.attachInvoiceDocuments(
        this.resourceType(),
        this.parentId(),
        validFiles,
        (file, _document, progress) => {
          this.patchUploadEntry(file, {
            progress,
            status: 'uploading',
          });
        },
      );

      const nextDocuments = [...this.localDocuments(), ...createdDocuments];
      this.localDocuments.set(nextDocuments);
      this.documentsChanged.emit(nextDocuments);
      this.uploadEntries.set([]);
      this.toastStore.success(
        createdDocuments.length === 1 ? 'Document attached.' : 'Documents attached.',
      );
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to attach documents.');
      this.uploadEntries.update((entries) =>
        entries.map((entry) => ({ ...entry, message, status: 'failed' })),
      );
      this.toastStore.danger(message);
    } finally {
      this.isUploading.set(false);
    }
  }

  protected async deleteDocument(document: StoredDocument): Promise<void> {
    const docId = document.id;
    if (!docId || this.isBusy() || !this.canDelete()) return;
    if (!window.confirm(`Delete ${document.name}?`)) return;

    this.deletingDocumentId.set(docId);
    try {
      await this.documentService.deleteInvoiceDocument(this.resourceType(), this.parentId(), docId);
      const nextDocuments = this.localDocuments().filter((item) => item.id !== docId);
      this.localDocuments.set(nextDocuments);
      this.documentsChanged.emit(nextDocuments);
      this.toastStore.success('Document deleted.');
    } catch (error) {
      this.toastStore.danger(getApiErrorMessage(error, 'Failed to delete document.'));
    } finally {
      this.deletingDocumentId.set(null);
    }
  }

  protected async downloadDocument(document: StoredDocument): Promise<void> {
    const docId = document.id;
    if (!docId || this.downloadingDocumentIds().has(docId) || !this.canDownload()) return;

    this.setDocumentDownloading(docId, true);
    try {
      const response = await this.documentService.getDownloadUrl(
        this.resourceType(),
        this.parentId(),
        docId,
      );
      startSignedDownload(response);
    } catch (error) {
      this.toastStore.danger(getDownloadErrorMessage(error, 'Failed to download document.'));
    } finally {
      this.setDocumentDownloading(docId, false);
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

  protected formatDate(value: string | undefined): string {
    if (!value) return 'Date unavailable';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Date unavailable';
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  protected documentType(document: StoredDocument): string {
    return (
      document.type?.toUpperCase() || this.extensionFromName(document.name).toUpperCase() || 'FILE'
    );
  }

  protected fileIcon(document: StoredDocument): string {
    const type = this.documentType(document).toLowerCase();
    if (type === 'pdf') return 'fileText';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(type)) return 'image';
    if (['xls', 'xlsx', 'csv'].includes(type)) return 'sheet';
    return 'paperclip';
  }

  protected trackDocument(_index: number, document: StoredDocument): string {
    return document.id ?? document.path ?? document.name;
  }

  protected trackUpload(_index: number, entry: UploadEntry): string {
    return entry.key;
  }

  private createUploadEntry(file: File): UploadEntry {
    return {
      key: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      progress: 0,
      status: 'creating',
    };
  }

  private setDocumentDownloading(documentId: string, downloading: boolean): void {
    this.downloadingDocumentIds.update((current) => {
      const next = new Set(current);
      if (downloading) next.add(documentId);
      else next.delete(documentId);
      return next;
    });
  }

  private patchUploadEntry(file: File, patch: Partial<UploadEntry>): void {
    this.uploadEntries.update((entries) =>
      entries.map((entry) => (entry.file === file ? { ...entry, ...patch } : entry)),
    );
  }

  private hasPermission(permissionName: 'create' | 'delete' | 'view'): boolean {
    return this.permissionsStore.can(documentPermission(this.resourceType(), permissionName));
  }

  private extensionFromName(name: string): string {
    const extension = name.split('.').pop()?.trim();
    return extension && extension !== name ? extension : '';
  }
}
