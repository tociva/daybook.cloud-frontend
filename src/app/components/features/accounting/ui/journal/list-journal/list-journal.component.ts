import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
} from '@tailng-ui/components';
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
import type { Journal, JournalEntry } from '../../../data/journal';
import { LedgerStore } from '../../../data/ledger';

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
  private readonly ledgerStore = inject(LedgerStore);
  protected readonly hasError = computed(() => this.journalStore.error() !== null);

  protected readonly ledgerById = computed(() => {
    const map = new Map<string, string>();
    for (const l of this.ledgerStore.items()) {
      if (l.id) map.set(l.id, l.name ?? l.id);
    }
    return map;
  });

  protected readonly loadingRows = [1, 2, 3, 4, 5];

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

    effect(() => {
      const items = this.journalStore.items();
      if (!items.length) return;
      const ids = [...new Set(items.flatMap((j) => (j.entries ?? []).map((e) => e.ledgerid)))];
      if (!ids.length) return;
      void this.ledgerStore.loadLedgers({
        where: { id: { inq: ids } },
        limit: ids.length + 10,
      });
    });
  }

  protected getLedgerName(ledgerid: string): string {
    return this.ledgerById().get(ledgerid) ?? ledgerid;
  }

  protected sortedEntries(entries: readonly JournalEntry[] | undefined): readonly JournalEntry[] {
    return [...(entries ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
