import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TngButtonComponent, TngCardComponent, TngTable, TngTableCellTpl } from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
} from '../../../../../../shared/crud';
import type { CrudFilterField } from '../../../../../../shared/crud';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import {
  XlsxExportButtonComponent,
  columnsFromTable,
  createCrudListXlsxDocument,
  date,
  number,
  text,
} from '../../../../../../shared/xlsx-export';
import { StoredDocumentService, StoredDocumentStore } from '../../../data/stored-document';
import type { StoredDocument } from '../../../data/stored-document';

import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
@Component({
  selector: 'app-list-document',
  standalone: true,
  imports: [
    PageHeadingComponent,
    BurlBackButtonComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    EmptyStateComponent,
    TngTable,
    TngTableCellTpl,
    XlsxExportButtonComponent,
  ],
  templateUrl: './list-document.component.html',
  styleUrl: './list-document.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListDocumentComponent {
  private readonly router = inject(Router);
  private readonly documentService = inject(StoredDocumentService);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly documentStore = inject(StoredDocumentStore);
  private readonly userSessionStore = inject(UserSessionStore);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly hasError = computed(() => this.documentStore.error() !== null);

  protected readonly columns: readonly TngTableColumn<StoredDocument>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '16rem' },
    { id: 'category', label: 'Category', sortable: true, width: '10rem' },
    { id: 'type', label: 'Type', sortable: true, width: '8rem' },
    { id: 'size', label: 'Size', sortable: true, align: 'end', headerAlign: 'end', width: '8rem' },
    { id: 'status', label: 'Status', sortable: true, width: '9rem' },
    { id: 'addedby', label: 'Added By', sortable: true, width: '12rem' },
    { id: 'createdat', label: 'Created', sortable: true, width: '10rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'name', label: 'Name', placeholder: 'Document name', type: 'text' },
    { id: 'category', label: 'Category', placeholder: 'Category', type: 'text' },
    { id: 'type', label: 'Type', placeholder: 'File type', type: 'text' },
    { id: 'status', label: 'Status', placeholder: 'Status', type: 'text' },
  ];

  constructor() {
    this.crudQuery.init((filter) => {
      void this.documentStore.loadDocuments({
        ...filter,
        includes: ['addedby'],
        order: filter.order?.length ? filter.order : ['createdat DESC'],
      });
    });
  }

  protected readonly exportDocuments = () =>
    createCrudListXlsxDocument({
      cachedRows: this.documentStore.items(),
      cachedTotal: this.documentStore.count(),
      columns: columnsFromTable(this.columns),
      count: (query) => this.documentService.count(query),
      fileNameBase: 'documents',
      list: (query) =>
        this.documentService.list({
          ...query,
          includes: ['addedby'],
          order: query.order?.length ? query.order : ['createdat DESC'],
        }),
      mapRow: (document) => [
        text(document.name),
        text(document.category),
        text(document.type),
        number(document.size, '#,##0'),
        text(document.status),
        text(this.resolveAddedByName(document)),
        date(document.createdat),
      ],
      query: this.crudQuery.filter(),
      sheetName: 'Documents',
      title: 'Documents',
    });

  protected viewDocument(item: StoredDocument): void {
    if (!item.id) return;
    this.documentStore.setSelectedItem(item);
    void this.router.navigate(['/app/accounting/documents', item.id], {
      queryParams: { burl: this.router.url },
    });
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

  protected formatDate(value?: string): string {
    return this.dateManagement.formatDisplayDateTime(value, '—');
  }

  protected resolveAddedByName(item: StoredDocument): string {
    const addedBy = item.addedby;
    if (addedBy) {
      const relationName =
        addedBy.displayname ?? addedBy.displayName ?? addedBy.name ?? addedBy.username ?? '';
      if (relationName.trim()) {
        return relationName.trim();
      }
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
}
