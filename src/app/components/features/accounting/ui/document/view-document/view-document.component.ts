import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TngTable, TngTableCellTpl } from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import {
  getDownloadErrorMessage,
  startSignedDownload,
} from '../../../../../../shared/file/signed-url-download.service';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import { DocumentStatus, StoredDocumentService, StoredDocumentStore } from '../../../data/stored-document';
import type { StoredDocument, StoredDocumentAddedBy } from '../../../data/stored-document';

type DocumentDetailRow = Readonly<{
  id: string;
  label: string;
  value: string;
}>;

@Component({
  selector: 'app-view-document',
  standalone: true,
  imports: [
    TngTable,
    TngTableCellTpl,
    BurlBackButtonComponent,
  ],
  templateUrl: './view-document.component.html',
  styleUrl: './view-document.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewDocumentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dateManagement = inject(DateManagementService);
  private readonly userSessionStore = inject(UserSessionStore);
  private readonly toastStore = inject(ToastStore);
  private readonly documentService = inject(StoredDocumentService);
  protected readonly documentStore = inject(StoredDocumentStore);
  protected readonly isDownloading = signal(false);
  protected readonly columns: readonly TngTableColumn<DocumentDetailRow>[] = [
    { id: 'label', label: 'Field', width: '16rem' },
    { id: 'value', label: 'Value' },
  ];
  protected readonly detailsRows = computed<readonly DocumentDetailRow[]>(() => {
    const item = this.documentStore.selectedItem();
    if (!item) return [];
    return [
      { id: 'name', label: 'Name', value: item.name || '—' },
      { id: 'category', label: 'Category', value: item.category || '—' },
      { id: 'type', label: 'Type', value: item.type || '—' },
      { id: 'status', label: 'Status', value: item.status || '—' },
      { id: 'size', label: 'Size', value: this.formatFileSize(item.size) },
      {
        id: 'download',
        label: 'Download',
        value: item.id && item.status === DocumentStatus.UPLOADED ? 'Download file' : '—',
      },
      {
        id: 'createdat',
        label: 'Created At',
        value: this.dateManagement.formatDisplayDateTime(item.createdat, '—'),
      },
      {
        id: 'updatedat',
        label: 'Updated At',
        value: this.dateManagement.formatDisplayDateTime(item.updatedat, '—'),
      },
      { id: 'addedby', label: 'Added By', value: this.resolveUserName(item) },
    ];
  });

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.documentStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const cached = this.documentStore.selectedItem();
    if (cached?.id === id && cached.addedby) return;
    await this.documentStore.loadDocumentById(id, { includes: ['addedby'] });
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

  private resolveUserName(item: StoredDocument): string {
    const relationName = this.relationUserName(item.addedby);
    if (relationName) {
      return relationName;
    }

    if (item.createdby?.trim()) {
      return item.createdby.trim();
    }

    const session = this.userSessionStore.session();
    if (item.addedbyid && session?.userid === item.addedbyid) {
      return session.displayname ?? session.displayName ?? session.username ?? session.name ?? '—';
    }

    return '—';
  }

  private relationUserName(addedBy?: StoredDocumentAddedBy): string | null {
    if (!addedBy) return null;
    const value = addedBy.displayname ?? addedBy.displayName ?? addedBy.name ?? addedBy.username ?? '';
    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }

  protected async downloadDocument(): Promise<void> {
    const item = this.documentStore.selectedItem();
    if (!item?.id || item.status !== DocumentStatus.UPLOADED || this.isDownloading()) return;
    this.isDownloading.set(true);
    try {
      const response = await this.documentService.getDownloadUrl(item.id);
      startSignedDownload(response);
    } catch (error) {
      this.toastStore.danger(getDownloadErrorMessage(error, 'Failed to generate download link.'));
    } finally {
      this.isDownloading.set(false);
    }
  }
}
