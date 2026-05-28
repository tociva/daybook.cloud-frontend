import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
} from '../../../../../../shared/crud';
import type { CrudFilterField } from '../../../../../../shared/crud';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { StoredDocumentStore } from '../../../data/stored-document';
import type { StoredDocument } from '../../../data/stored-document';

@Component({
  selector: 'app-list-document',
  standalone: true,
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    EmptyStateComponent,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './list-document.component.html',
  styleUrl: './list-document.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListDocumentComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly documentStore = inject(StoredDocumentStore);
  protected readonly hasError = computed(() => this.documentStore.error() !== null);

  protected readonly columns: readonly TngTableColumn<StoredDocument>[] = [
    { id: 'name', label: 'Name', sortable: true, width: '16rem' },
    { id: 'category', label: 'Category', sortable: true, width: '10rem' },
    { id: 'type', label: 'Type', sortable: true, width: '8rem' },
    { id: 'size', label: 'Size', sortable: true, align: 'end', headerAlign: 'end', width: '8rem' },
    { id: 'status', label: 'Status', sortable: true, width: '9rem' },
    { id: 'createdat', label: 'Created', sortable: true, width: '10rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
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
        order: filter.order?.length ? filter.order : ['createdat DESC'],
      });
    });
  }

  protected createDocument(): void {
    void this.router.navigate(['/app/accounting/documents/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewDocument(item: StoredDocument): void {
    if (!item.id) return;
    this.documentStore.setSelectedItem(item);
    void this.router.navigate(['/app/accounting/documents', item.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected editDocument(item: StoredDocument): void {
    if (!item.id) return;
    this.documentStore.setSelectedItem(item);
    void this.router.navigate(['/app/accounting/documents', item.id, 'edit'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected deleteDocument(item: StoredDocument): void {
    if (!item.id) return;
    this.documentStore.setSelectedItem(item);
    void this.router.navigate(['/app/accounting/documents', item.id, 'delete'], {
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
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}
