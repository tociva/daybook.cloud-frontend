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
import { BulkUploadButtonComponent } from '../../../../../../shared/bulk-upload';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { JournalStore } from '../../../data/journal';
import type { Journal } from '../../../data/journal';

@Component({
  selector: 'app-list-journal',
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
    BulkUploadButtonComponent,
  ],
  templateUrl: './list-journal.component.html',
  styleUrl: './list-journal.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListJournalComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly journalStore = inject(JournalStore);
  protected readonly hasError = computed(() => this.journalStore.error() !== null);

  protected readonly columns: readonly TngTableColumn<Journal>[] = [
    { id: 'number', label: 'Number', sortable: true, width: '11rem' },
    { id: 'date', label: 'Date', sortable: true, width: '9rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'debit', label: 'Debit', align: 'end', headerAlign: 'end', width: '9rem' },
    { id: 'credit', label: 'Credit', align: 'end', headerAlign: 'end', width: '9rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'number', label: 'Number', placeholder: 'Journal number', type: 'text' },
    { id: 'description', label: 'Description', placeholder: 'Description text', type: 'text' },
    {
      id: 'date',
      label: 'Date',
      type: 'date',
      fiscalYear: true,
      operators: ['between', '=', '>=', '<='],
    },
  ];

  constructor() {
    this.crudQuery.init((filter) => {
      const query = {
        ...filter,
        includes: ['entries'] as const,
        order: filter.order?.length ? filter.order : (['date DESC'] as const),
      };
      void this.journalStore.loadJournals(query);
    });
  }

  protected sumDebit(j: Journal): number {
    return (j.entries ?? []).reduce((s, e) => s + (e.debit ?? 0), 0);
  }

  protected sumCredit(j: Journal): number {
    return (j.entries ?? []).reduce((s, e) => s + (e.credit ?? 0), 0);
  }

  protected createJournal(): void {
    void this.router.navigate(['/app/accounting/journal/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected reloadJournals(): void {
    const filter = this.crudQuery.filter();
    void this.journalStore.loadJournals({
      ...filter,
      includes: ['entries'],
      order: filter.order?.length ? filter.order : ['date DESC'],
    });
  }

  protected viewJournal(item: Journal): void {
    this.journalStore.setSelectedItem(item);
    void this.router.navigate(['/app/accounting/journal', item.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected editJournal(item: Journal): void {
    this.journalStore.setSelectedItem(item);
    void this.router.navigate(['/app/accounting/journal', item.id, 'edit'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected deleteJournal(item: Journal): void {
    this.journalStore.setSelectedItem(item);
    void this.router.navigate(['/app/accounting/journal', item.id, 'delete'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected openLedgers(): void {
    void this.router.navigate(['/app/accounting/ledger'], {
      queryParams: { burl: this.router.url },
    });
  }
}
