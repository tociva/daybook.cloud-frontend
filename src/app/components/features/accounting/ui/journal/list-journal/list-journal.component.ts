import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn, TngTableRowClassFn } from '@tailng-ui/components';
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
import { JournalService, JournalStore } from '../../../data/journal';
import type { Journal, JournalEntry } from '../../../data/journal';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';
import { LedgerService } from '../../../data/ledger/ledger.service';

type JournalTableRow = Readonly<{
  credit: number | null | undefined;
  date: string;
  debit: number | null | undefined;
  description: string;
  entry: JournalEntry | null;
  journal: Journal;
  journalGroupKey: string;
  ledgerid: string;
  number: string;
  rowKey: string;
}>;

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
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './list-journal.component.html',
  styleUrl: './list-journal.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListJournalComponent {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  private readonly journalService = inject(JournalService);
  protected readonly journalStore = inject(JournalStore);
  private readonly ledgerService = inject(LedgerService);
  private readonly ledgerStore = inject(LedgerStore);
  protected readonly hasError = computed(() => this.journalStore.error() !== null);
  protected readonly unfilteredJournalCount = signal<number | null>(null);

  /** Local map of ledger id → name, populated after each journal page load. */
  private readonly ledgerNames = signal(new Map<string, string>());
  private ledgerNameFetchVersion = 0;
  private unfilteredJournalCountFetchVersion = 0;

  protected readonly columns: readonly TngTableColumn<JournalTableRow>[] = [
    {
      id: 'journalGroupKey',
      label: 'Number',
      accessor: 'journalGroupKey',
      groupBy: true,
      groupByAlign: 'top',
      width: '11rem',
    },
    {
      id: 'date',
      label: 'Date',
      accessor: 'journalGroupKey',
      groupBy: true,
      groupByAlign: 'top',
      width: '9rem',
    },
    { id: 'ledgerid', label: 'Ledger', width: '15rem' },
    { id: 'debit', label: 'Debit', align: 'end', headerAlign: 'end', width: '9rem' },
    { id: 'credit', label: 'Credit', align: 'end', headerAlign: 'end', width: '9rem' },
    {
      id: 'description',
      label: 'Description',
      accessor: 'journalGroupKey',
      groupBy: true,
      groupByAlign: 'top',
      truncate: true,
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: 'journalGroupKey',
      align: 'end',
      groupBy: true,
      groupByAlign: 'top',
      headerAlign: 'end',
      width: '8rem',
    },
  ];

  protected readonly rows = computed<readonly JournalTableRow[]>(() =>
    this.journalStore.items().flatMap((journal, index) => this.toJournalRows(journal, index)),
  );

  /** Maps each journalGroupKey to its 0-based group index across the current page. */
  private readonly journalGroupOrder = computed(() => {
    const order = new Map<string, number>();
    let i = 0;
    for (const row of this.rows()) {
      if (!order.has(row.journalGroupKey)) order.set(row.journalGroupKey, i++);
    }
    return order;
  });

  protected readonly rowClassFn = computed<TngTableRowClassFn<JournalTableRow> | null>(() => {
    const order = this.journalGroupOrder();
    return (row) => ((order.get(row.journalGroupKey) ?? 0) % 2 === 1 ? 'journal-row--alt' : null);
  });

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
      void this.refreshUnfilteredJournalCount(filter);
    });

    // After journals load, fetch only the specific ledger IDs visible on this page.
    // Uses LedgerService directly to avoid triggering LedgerStore.loadLedgers(),
    // which would warm the full ledger catalog on first use and slow page load.
    effect(() => {
      const items = this.journalStore.items();
      if (!items.length) return;
      const ids = this.collectLedgerIds(items);
      if (!ids.length) return;
      void untracked(() => this.fetchLedgerNames(ids));
    });
  }

  private async refreshUnfilteredJournalCount(
    filter: { where?: Record<string, unknown> },
  ): Promise<void> {
    const fetchVersion = ++this.unfilteredJournalCountFetchVersion;
    const hasActiveFilter = Object.keys(filter.where ?? {}).length > 0;

    if (!hasActiveFilter) {
      this.unfilteredJournalCount.set(null);
      return;
    }

    try {
      const count = await this.journalService.count({});
      if (fetchVersion !== this.unfilteredJournalCountFetchVersion) return;
      this.unfilteredJournalCount.set(count);
    } catch {
      if (fetchVersion !== this.unfilteredJournalCountFetchVersion) return;
      this.unfilteredJournalCount.set(null);
    }
  }

  private async fetchLedgerNames(ids: readonly string[]): Promise<void> {
    const fetchVersion = ++this.ledgerNameFetchVersion;
    const cachedNames = this.resolveCachedLedgerNames(ids);
    this.mergeLedgerNames(cachedNames);

    const missingIds = ids.filter((id) => !cachedNames.has(id));
    if (!missingIds.length) return;

    // Fetch only ledgers that are needed for the current journal page and absent from cache.
    try {
      const ledgers = await this.ledgerService.list({
        where: { id: { inq: missingIds } },
        limit: missingIds.length,
      });
      if (fetchVersion !== this.ledgerNameFetchVersion) return;
      this.mergeLedgerNames(this.toLedgerNameMap(ledgers));
    } catch {
      // Non-critical: IDs shown as fallback
    }
  }

  private collectLedgerIds(items: readonly Journal[]): readonly string[] {
    return [
      ...new Set(
        items
          .flatMap((journal) => journal.entries ?? [])
          .map((entry) => entry.ledgerid)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
  }

  private resolveCachedLedgerNames(ids: readonly string[]): ReadonlyMap<string, string> {
    const requestedIds = new Set(ids);
    const cachedNames = new Map<string, string>();

    for (const [id, name] of this.ledgerNames()) {
      if (requestedIds.has(id)) cachedNames.set(id, name);
    }

    const ledgerState = this.ledgerStore.ledger();
    this.addLedgerNames(cachedNames, requestedIds, ledgerState.catalog);
    this.addLedgerNames(cachedNames, requestedIds, ledgerState.items);

    const selectedLedger = ledgerState.selectedItem;
    if (selectedLedger) {
      this.addLedgerNames(cachedNames, requestedIds, [selectedLedger]);
    }

    return cachedNames;
  }

  private addLedgerNames(
    target: Map<string, string>,
    requestedIds: ReadonlySet<string>,
    ledgers: readonly Ledger[],
  ): void {
    for (const ledger of ledgers) {
      if (ledger.id && requestedIds.has(ledger.id)) {
        target.set(ledger.id, ledger.name ?? ledger.id);
      }
    }
  }

  private mergeLedgerNames(names: ReadonlyMap<string, string>): void {
    if (!names.size) return;

    this.ledgerNames.update((current) => {
      const next = new Map(current);
      for (const [id, name] of names) {
        next.set(id, name);
      }
      return next;
    });
  }

  private toLedgerNameMap(ledgers: readonly Ledger[]): ReadonlyMap<string, string> {
    return new Map(
      ledgers.flatMap((ledger) => (ledger.id ? [[ledger.id, ledger.name ?? ledger.id]] : [])),
    );
  }

  private toJournalRows(journal: Journal, journalIndex: number): readonly JournalTableRow[] {
    const entries = this.sortedEntries(journal.entries);
    const groupKey = this.journalGroupKey(journal, journalIndex);
    const common = {
      date: journal.date,
      description: journal.description ?? '',
      journal,
      journalGroupKey: groupKey,
      number: journal.number,
    };

    if (entries.length === 0) {
      return [
        {
          ...common,
          credit: null,
          debit: null,
          entry: null,
          ledgerid: '',
          rowKey: `${groupKey}:empty`,
        },
      ];
    }

    return entries.map((entry, entryIndex) => ({
      ...common,
      credit: entry.credit,
      debit: entry.debit,
      entry,
      ledgerid: entry.ledgerid,
      rowKey: entry.id ?? `${groupKey}:${entry.ledgerid}:${entry.order ?? entryIndex}`,
    }));
  }

  private journalGroupKey(journal: Journal, index: number): string {
    return journal.id ?? `${journal.number}:${journal.date}:${index}`;
  }

  protected getLedgerName(ledgerid: string): string {
    return this.ledgerNames().get(ledgerid) ?? ledgerid;
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
