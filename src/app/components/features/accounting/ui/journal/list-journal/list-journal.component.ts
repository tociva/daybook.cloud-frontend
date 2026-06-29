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
  TngDialogComponent,
  TngMenuComponent,
  TngMenuTriggerFor,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn, TngTableRowClassFn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { CanDirective } from '../../../../../../core/permissions/can.directive';
import { PERMISSION } from '../../../../../../core/permissions/permission-requirements';
import type { PermissionRequirement } from '../../../../../../core/permissions/permissions.model';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import { TngMenuItem } from '@tailng-ui/primitives';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
} from '../../../../../../shared/crud';
import type { CrudFilterField } from '../../../../../../shared/crud';
import { BulkUploadButtonComponent } from '../../../../../../shared/bulk-upload';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import {
  XlsxExportButtonComponent,
  createXlsxListDocument,
  date,
  fetchAllLb4Rows,
  number,
  text,
} from '../../../../../../shared/xlsx-export';
import type { XlsxMergeRange } from '../../../../../../shared/xlsx-export';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import {
  JournalService,
  JournalSourceType,
  JournalStore,
  journalSourceTypeLabel,
} from '../../../data/journal';
import type { Journal, JournalEntry } from '../../../data/journal';
import { LedgerStore } from '../../../data/ledger';
import type { Ledger } from '../../../data/ledger';
import { LedgerService } from '../../../data/ledger/ledger.service';
import { SaleInvoiceService } from '../../../../trading/data/sale-invoice';
import type { SaleInvoice } from '../../../../trading/data/sale-invoice';
import { PurchaseInvoiceService } from '../../../../trading/data/purchase-invoice';
import type { PurchaseInvoice } from '../../../../trading/data/purchase-invoice';
import { CustomerReceiptService } from '../../../../trading/data/customer-receipt';
import type { CustomerReceipt } from '../../../../trading/data/customer-receipt';
import { VendorPaymentService } from '../../../../trading/data/vendor-payment';
import type { VendorPayment } from '../../../../trading/data/vendor-payment';
import { ContraTransactionService } from '../../../../trading/data/contra-transaction';
import type { ContraTransaction } from '../../../../trading/data/contra-transaction';
import {
  ReconciliationMatchFacade,
  ReconciliationMatchService,
} from '../../../data/reconciliation-match';
import {
  JournalImportDialogComponent,
  type JournalImportDialogCandidate,
  type JournalImportDialogConfig,
} from './journal-import-dialog/journal-import-dialog.component';

type JournalSourceMatch = Readonly<{
  sourceid: string;
  sourcetype: JournalSourceType;
}>;

type JournalTableRow = Readonly<{
  credit: number | null | undefined;
  date: string;
  debit: number | null | undefined;
  description: string;
  entry: JournalEntry | null;
  entryCount: number;
  entryIndex: number;
  journal: Journal;
  journalGroupKey: string;
  ledgerid: string;
  number: string;
  rowKey: string;
  sourcetype: JournalSourceType | string | undefined;
}>;

type JournalImportSource =
  | 'saleInvoice'
  | 'purchaseInvoice'
  | 'customerReceipt'
  | 'vendorPayment'
  | 'contraTransaction';

type JournalImportCandidate = JournalImportDialogCandidate;

type JournalImportConfig = JournalImportDialogConfig & Readonly<{
  sourceType: JournalSourceType;
}>;

const JOURNAL_IMPORT_CONFIG: Record<JournalImportSource, JournalImportConfig> = {
  saleInvoice: {
    actionLabel: 'Create Journals',
    amountLabel: 'Grand Total',
    dialogTitle: 'Import Sale Invoice Journals',
    emptyDescription: 'All sale invoices already have journals generated.',
    emptyTitle: 'No sale invoices to import',
    itemLabel: 'sale invoice',
    sourceType: JournalSourceType.SALE_INVOICE,
  },
  purchaseInvoice: {
    actionLabel: 'Create Journals',
    amountLabel: 'Grand Total',
    dialogTitle: 'Import Purchase Invoice Journals',
    emptyDescription: 'All purchase invoices already have journals generated.',
    emptyTitle: 'No purchase invoices to import',
    itemLabel: 'purchase invoice',
    sourceType: JournalSourceType.PURCHASE_INVOICE,
  },
  customerReceipt: {
    actionLabel: 'Create Journals',
    amountLabel: 'Amount',
    dialogTitle: 'Import Customer Receipt Journals',
    emptyDescription: 'All customer receipts already have journals generated.',
    emptyTitle: 'No customer receipts to import',
    itemLabel: 'customer receipt',
    sourceType: JournalSourceType.RECEIPT,
  },
  vendorPayment: {
    actionLabel: 'Create Journals',
    amountLabel: 'Amount',
    dialogTitle: 'Import Vendor Payment Journals',
    emptyDescription: 'All vendor payments already have journals generated.',
    emptyTitle: 'No vendor payments to import',
    itemLabel: 'vendor payment',
    sourceType: JournalSourceType.PAYMENT,
  },
  contraTransaction: {
    actionLabel: 'Create Journals',
    amountLabel: 'Amount',
    dialogTitle: 'Import Contra Transaction Journals',
    emptyDescription: 'All contra transactions already have journals generated.',
    emptyTitle: 'No contra transactions to import',
    itemLabel: 'contra transaction',
    sourceType: JournalSourceType.CONTRA_TRANSACTION,
  },
};

const DEFAULT_JOURNAL_ORDER = ['date DESC'] as const;
const COLLAPSED_ENTRY_LIMIT = 2;
const JOURNAL_SOURCE_TYPE_FILTER_VALUES = [
  JournalSourceType.GENERAL,
  JournalSourceType.BANK_TXN,
  JournalSourceType.SALE_INVOICE,
  JournalSourceType.PURCHASE_INVOICE,
  JournalSourceType.RECEIPT,
  JournalSourceType.PAYMENT,
  JournalSourceType.CONTRA_TRANSACTION,
  JournalSourceType.CREDIT_NOTE,
  JournalSourceType.DEBIT_NOTE,
] as const;

import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
@Component({
  selector: 'app-list-journal',
  standalone: true,
  imports: [
    CanDirective,
    PageHeadingComponent,
    BurlBackButtonComponent,
    TngButtonComponent,
    TngCardComponent,
    TngDialogComponent,
    TngMenuComponent,
    TngMenuTriggerFor,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    TngMenuItem,
    EmptyStateComponent,
    BulkUploadButtonComponent,
    JournalImportDialogComponent,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
    XlsxExportButtonComponent,
  ],
  templateUrl: './list-journal.component.html',
  styleUrl: './list-journal.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListJournalComponent {
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionsStore);
  protected readonly crudQuery = inject(CrudListQueryService);
  private readonly journalService = inject(JournalService);
  protected readonly journalStore = inject(JournalStore);
  private readonly ledgerService = inject(LedgerService);
  private readonly ledgerStore = inject(LedgerStore);
  private readonly saleInvoiceService = inject(SaleInvoiceService);
  private readonly purchaseInvoiceService = inject(PurchaseInvoiceService);
  private readonly customerReceiptService = inject(CustomerReceiptService);
  private readonly vendorPaymentService = inject(VendorPaymentService);
  private readonly contraTransactionService = inject(ContraTransactionService);
  private readonly toastStore = inject(ToastStore);
  private readonly reconciliationMatchFacade = inject(ReconciliationMatchFacade);
  private readonly reconciliationMatchService = inject(ReconciliationMatchService);
  protected readonly hasError = computed(() => this.journalStore.error() !== null);
  private readonly sourceMatchByJournalId = signal(new Map<string, JournalSourceMatch>());
  protected readonly pendingUnlinkJournal = signal<Journal | null>(null);
  protected readonly unlinkingJournalId = signal<string | null>(null);
  protected readonly unfilteredJournalCount = signal<number | null>(null);
  protected readonly journalImportSource = signal<JournalImportSource | null>(null);
  protected readonly journalImportCandidates = signal<readonly JournalImportCandidate[]>([]);
  protected readonly journalImportError = signal<string | null>(null);
  protected readonly journalImportLoading = signal(false);
  protected readonly journalImportGenerating = signal(false);
  protected readonly journalImportConfig = computed<JournalImportConfig | null>(() => {
    const source = this.journalImportSource();
    return source ? JOURNAL_IMPORT_CONFIG[source] : null;
  });
  protected readonly canImportAnySource = computed(() =>
    (Object.keys(JOURNAL_IMPORT_CONFIG) as JournalImportSource[]).some((source) =>
      this.canImportSource(source),
    ),
  );

  /** Local map of ledger id → name, populated after each journal page load. */
  private readonly ledgerNames = signal(new Map<string, string>());
  private ledgerNameFetchVersion = 0;
  private sourceMatchFetchVersion = 0;
  private unfilteredJournalCountFetchVersion = 0;

  protected readonly columns: readonly TngTableColumn<JournalTableRow>[] = [
    {
      id: 'number',
      label: 'Number',
      accessor: 'journalGroupKey',
      groupBy: true,
      groupByAlign: 'top',
      sortable: true,
      width: '11rem',
    },
    {
      id: 'date',
      label: 'Date',
      accessor: 'journalGroupKey',
      groupBy: true,
      groupByAlign: 'top',
      sortable: true,
      width: '9rem',
    },
    {
      id: 'sourcetype',
      label: 'Type',
      accessor: 'journalGroupKey',
      groupBy: true,
      groupByAlign: 'top',
      sortable: true,
      width: '11rem',
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
      sortable: true,
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
      width: '10rem',
    },
  ];

  protected readonly rows = computed<readonly JournalTableRow[]>(() =>
    this.journalStore.items().flatMap((journal, index) => this.toJournalRows(journal, index)),
  );

  private readonly expandedJournalGroups = signal<ReadonlySet<string>>(new Set());

  protected readonly displayRows = computed<readonly JournalTableRow[]>(() => {
    const expanded = this.expandedJournalGroups();
    return this.rows().filter((row) => {
      if (row.entryCount <= COLLAPSED_ENTRY_LIMIT) return true;
      if (expanded.has(row.journalGroupKey)) return true;
      return row.entryIndex < COLLAPSED_ENTRY_LIMIT;
    });
  });

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
      id: 'sourcetype',
      label: 'Type',
      options: JOURNAL_SOURCE_TYPE_FILTER_VALUES.map((value) => ({
        label: journalSourceTypeLabel(value),
        value,
      })),
      placeholder: 'Any type',
      type: 'enum',
    },
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
        order: filter.order?.length ? filter.order : DEFAULT_JOURNAL_ORDER,
      };
      void this.journalStore.loadJournals(query);
      void this.refreshUnfilteredJournalCount(filter);
    });

    // After journals load, fetch only the specific ledger IDs visible on this page.
    // Uses LedgerService directly to avoid triggering LedgerStore.loadLedgers(),
    // which would warm the full ledger catalog on first use and slow page load.
    effect(() => {
      const items = this.journalStore.items();
      if (!this.permissions.can(PERMISSION.fiscalYear.ledger.view)) return;
      if (!items.length) return;
      const ids = this.collectLedgerIds(items);
      if (!ids.length) return;
      void untracked(() => this.fetchLedgerNames(ids));
    });

    effect(() => {
      const items = this.journalStore.items();
      const error = this.journalStore.error();
      if (error || !items.length) {
        untracked(() => this.sourceMatchByJournalId.set(new Map()));
        return;
      }

      const journalIds = [
        ...new Set(items.map((journal) => journal.id).filter((id): id is string => Boolean(id))),
      ];
      if (!journalIds.length) return;
      void untracked(() => this.fetchSourceMatches(journalIds));
    });
  }

  protected readonly exportJournals = async () => {
    const filter = this.crudQuery.filter();
    const journals = await fetchAllLb4Rows(
      (query) => this.journalService.list(query),
      {
        ...filter,
        includes: ['entries'],
        order: filter.order?.length ? filter.order : DEFAULT_JOURNAL_ORDER,
      },
      { count: (query) => this.journalService.count(query) },
    );
    const ledgerNames = await this.exportLedgerNames(journals);
    const rows: ReturnType<typeof text>[][] = [];
    const merges: XlsxMergeRange[] = [];
    let sheetRow = 3;

    journals.forEach((journal, journalIndex) => {
      const journalRows = this.toJournalRows(journal, journalIndex);
      const rowCount = Math.max(journalRows.length, 1);
      if (rowCount > 1) {
        for (const column of [1, 2, 3, 7]) {
          merges.push({
            startRow: sheetRow,
            startColumn: column,
            endRow: sheetRow + rowCount - 1,
            endColumn: column,
          });
        }
      }

      for (const row of journalRows) {
        rows.push([
          text(row.number),
          date(row.date),
          text(this.getSourceTypeLabel(row.sourcetype)),
          text(row.ledgerid ? ledgerNames.get(row.ledgerid) ?? row.ledgerid : ''),
          number(row.debit),
          number(row.credit),
          text(row.description),
        ]);
      }
      sheetRow += rowCount;
    });

    return createXlsxListDocument({
      columns: [
        { header: 'Number', width: 14 },
        { header: 'Date', kind: 'date', format: 'yyyy-mm-dd', width: 12 },
        { header: 'Type', width: 16 },
        { header: 'Ledger', width: 26 },
        { header: 'Debit', kind: 'number', format: '#,##0.00', align: 'right', width: 14 },
        { header: 'Credit', kind: 'number', format: '#,##0.00', align: 'right', width: 14 },
        { header: 'Description', width: 30 },
      ],
      fileNameBase: 'journals',
      merges,
      rows,
      sheetName: 'Journals',
      title: 'Journals',
    });
  };

  private async exportLedgerNames(journals: readonly Journal[]): Promise<ReadonlyMap<string, string>> {
    const ids = this.collectLedgerIds(journals);
    const cached = new Map(this.resolveCachedLedgerNames(ids));
    const missing = ids.filter((id) => !cached.has(id));

    if (!missing.length || !this.permissions.can(PERMISSION.fiscalYear.ledger.view)) {
      return cached;
    }

    const ledgers = await this.ledgerService.list({
      limit: missing.length,
      offset: 0,
      where: { id: { inq: missing } },
    });
    for (const ledger of ledgers) {
      if (ledger.id) {
        cached.set(ledger.id, ledger.name ?? ledger.id);
      }
    }
    this.mergeLedgerNames(cached);
    return cached;
  }

  private async fetchSourceMatches(journalIds: readonly string[]): Promise<void> {
    const fetchVersion = ++this.sourceMatchFetchVersion;

    if (!this.permissions.canAny(this.reconciliationDeletePermissions())) {
      this.sourceMatchByJournalId.set(new Map());
      return;
    }

    try {
      const matches = await this.reconciliationMatchService.findByJournalIds(journalIds);
      if (fetchVersion !== this.sourceMatchFetchVersion) return;

      const map = new Map<string, JournalSourceMatch>();
      for (const match of matches) {
        if (!match.journalid || !match.sourceid) continue;
        map.set(match.journalid, {
          sourceid: match.sourceid,
          sourcetype: match.sourcetype as JournalSourceType,
        });
      }
      this.sourceMatchByJournalId.set(map);
    } catch {
      if (fetchVersion !== this.sourceMatchFetchVersion) return;
      this.sourceMatchByJournalId.set(new Map());
    }
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
      sourcetype: journal.sourcetype,
    };

    if (entries.length === 0) {
      return [
        {
          ...common,
          credit: null,
          debit: null,
          entry: null,
          entryCount: 1,
          entryIndex: 0,
          ledgerid: '',
          rowKey: `${groupKey}:empty`,
        },
      ];
    }

    const entryCount = entries.length;

    return entries.map((entry, entryIndex) => ({
      ...common,
      credit: entry.credit,
      debit: entry.debit,
      entry,
      entryCount,
      entryIndex,
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

  protected hiddenEntryCount(row: JournalTableRow): number {
    return Math.max(row.entryCount - COLLAPSED_ENTRY_LIMIT, 0);
  }

  protected showMoreLink(row: JournalTableRow): boolean {
    return (
      row.entryCount > COLLAPSED_ENTRY_LIMIT &&
      row.entryIndex === COLLAPSED_ENTRY_LIMIT - 1 &&
      !this.expandedJournalGroups().has(row.journalGroupKey)
    );
  }

  protected showLessLink(row: JournalTableRow): boolean {
    return (
      row.entryCount > COLLAPSED_ENTRY_LIMIT &&
      row.entryIndex === row.entryCount - 1 &&
      this.expandedJournalGroups().has(row.journalGroupKey)
    );
  }

  protected expandJournal(groupKey: string): void {
    this.expandedJournalGroups.update((current) => new Set([...current, groupKey]));
  }

  protected collapseJournal(groupKey: string): void {
    this.expandedJournalGroups.update((current) => {
      const next = new Set(current);
      next.delete(groupKey);
      return next;
    });
  }

  protected getSourceTypeLabel(sourcetype: JournalSourceType | string | undefined): string {
    return journalSourceTypeLabel(sourcetype);
  }

  protected sortedEntries(entries: readonly JournalEntry[] | undefined): readonly JournalEntry[] {
    return [...(entries ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  protected async openJournalImportDialog(source: JournalImportSource): Promise<void> {
    if (!this.canImportSource(source)) return;
    this.journalImportSource.set(source);
    await this.loadJournalImportCandidates();
  }

  protected closeJournalImportDialog(): void {
    if (this.journalImportGenerating()) return;
    this.journalImportSource.set(null);
  }

  protected async createImportedJournals(): Promise<void> {
    const source = this.journalImportSource();
    const ids = this.journalImportCandidates().map((item) => item.id);

    if (!source || !this.canImportSource(source) || !ids.length || this.journalImportGenerating()) return;

    this.journalImportGenerating.set(true);
    this.journalImportError.set(null);

    try {
      const journals = await this.createJournalsForSource(source, ids);
      this.toastStore.success(
        `${journals.length} journal${journals.length === 1 ? '' : 's'} generated.`,
      );
      this.journalImportSource.set(null);
      this.journalImportCandidates.set([]);
      this.reloadJournals();
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to generate journals.');
      this.journalImportError.set(message);
      this.toastStore.danger(message);
      await this.loadJournalImportCandidates({ preserveError: true });
    } finally {
      this.journalImportGenerating.set(false);
    }
  }

  private async loadJournalImportCandidates(
    options: { preserveError?: boolean } = {},
  ): Promise<void> {
    const source = this.journalImportSource();
    if (!source || this.journalImportLoading()) return;

    this.journalImportLoading.set(true);
    if (!options.preserveError) {
      this.journalImportError.set(null);
    }

    try {
      const candidates = await this.fetchImportCandidates(source);
      const sourceIds = candidates.map((candidate) => candidate.id);
      const generatedSourceIds = await this.fetchGeneratedJournalSourceIds(source, sourceIds);

      this.journalImportCandidates.set(
        candidates.filter((candidate) => !generatedSourceIds.has(candidate.id)),
      );
    } catch (error) {
      this.journalImportCandidates.set([]);
      this.journalImportError.set(
        getApiErrorMessage(error, 'Failed to load source documents for journal generation.'),
      );
    } finally {
      this.journalImportLoading.set(false);
    }
  }

  private async fetchImportCandidates(
    source: JournalImportSource,
  ): Promise<readonly JournalImportCandidate[]> {
    switch (source) {
      case 'saleInvoice':
        return this.fetchSaleInvoiceImportCandidates();
      case 'purchaseInvoice':
        return this.fetchPurchaseInvoiceImportCandidates();
      case 'customerReceipt':
        return this.fetchCustomerReceiptImportCandidates();
      case 'vendorPayment':
        return this.fetchVendorPaymentImportCandidates();
      case 'contraTransaction':
        return this.fetchContraTransactionImportCandidates();
    }
  }

  private async fetchSaleInvoiceImportCandidates(): Promise<readonly JournalImportCandidate[]> {
    const count = await this.saleInvoiceService.count({});
    const invoices =
      count > 0
        ? await this.saleInvoiceService.list({
            includes: ['customer'],
            limit: count,
            order: ['date DESC'],
          })
        : [];

    return invoices
      .filter((invoice) => invoice.id && !this.hasGeneratedJournal(invoice))
      .map((invoice) => ({
        id: invoice.id ?? '',
        amount: invoice.grandtotal,
        currencycode: invoice.currencycode,
        date: invoice.date,
        number: invoice.number || '—',
        party: invoice.customer?.name || '—',
      }));
  }

  private async fetchPurchaseInvoiceImportCandidates(): Promise<readonly JournalImportCandidate[]> {
    const count = await this.purchaseInvoiceService.count({});
    const invoices =
      count > 0
        ? await this.purchaseInvoiceService.list({
            includes: ['vendor'],
            limit: count,
            order: ['date DESC'],
          })
        : [];

    return invoices
      .filter((invoice) => invoice.id && !this.hasGeneratedJournal(invoice))
      .map((invoice) => ({
        id: invoice.id ?? '',
        amount: invoice.grandtotal,
        currencycode: invoice.currencycode,
        date: invoice.date,
        number: invoice.number || '—',
        party: invoice.vendor?.name || '—',
      }));
  }

  private async fetchCustomerReceiptImportCandidates(): Promise<readonly JournalImportCandidate[]> {
    const count = await this.customerReceiptService.count({});
    const receipts =
      count > 0
        ? await this.customerReceiptService.list({
            includes: ['customer'],
            limit: count,
            order: ['date DESC'],
          })
        : [];

    return receipts
      .filter((receipt) => Boolean(receipt.id))
      .map((receipt) => ({
        id: receipt.id ?? '',
        amount: receipt.amount,
        currencycode: receipt.currencycode,
        date: receipt.date,
        number: receipt.number || '—',
        party: receipt.customer?.name || '—',
      }));
  }

  private async fetchVendorPaymentImportCandidates(): Promise<readonly JournalImportCandidate[]> {
    const count = await this.vendorPaymentService.count({});
    const payments =
      count > 0
        ? await this.vendorPaymentService.list({
            includes: ['vendor'],
            limit: count,
            order: ['date DESC'],
          })
        : [];

    return payments
      .filter((payment) => Boolean(payment.id))
      .map((payment) => ({
        id: payment.id ?? '',
        amount: payment.amount,
        currencycode: payment.currencycode,
        date: payment.date,
        number: '—',
        party: payment.vendor?.name || '—',
      }));
  }

  private async fetchContraTransactionImportCandidates(): Promise<
    readonly JournalImportCandidate[]
  > {
    const count = await this.contraTransactionService.count({});
    const contraTransactions =
      count > 0
        ? await this.contraTransactionService.list({
            includes: ['frombcash', 'tobcash'],
            limit: count,
            order: ['date DESC'],
          })
        : [];

    return contraTransactions
      .filter((contraTransaction) => Boolean(contraTransaction.id))
      .map((contraTransaction) => ({
        id: contraTransaction.id ?? '',
        amount: contraTransaction.amount,
        currencycode: contraTransaction.currencycode,
        date: contraTransaction.date,
        number: '—',
        party: this.formatContraTransactionAccounts(contraTransaction),
      }));
  }

  private formatContraTransactionAccounts(contraTransaction: ContraTransaction): string {
    const fromAccount =
      contraTransaction.frombcash?.name || contraTransaction.frombcashid || '—';
    const toAccount = contraTransaction.tobcash?.name || contraTransaction.tobcashid || '—';
    return `${fromAccount} -> ${toAccount}`;
  }

  private hasGeneratedJournal(
    document: Pick<SaleInvoice | PurchaseInvoice, 'sprops'>,
  ): boolean {
    const journal = document.sprops?.journal;
    return typeof journal === 'string' ? journal.trim().length > 0 : Boolean(journal);
  }

  private async fetchGeneratedJournalSourceIds(
    source: JournalImportSource,
    sourceIds: readonly string[],
  ): Promise<ReadonlySet<string>> {
    if (!sourceIds.length) return new Set();

    const groups = await this.reconciliationMatchService.findJournalsBySourceIds(
      JOURNAL_IMPORT_CONFIG[source].sourceType,
      sourceIds,
    );

    return new Set(
      groups.filter((group) => group.journals.length > 0).map((group) => group.sourceid),
    );
  }

  private createJournalsForSource(
    source: JournalImportSource,
    ids: readonly string[],
  ): Promise<readonly Journal[]> {
    switch (source) {
      case 'saleInvoice':
        return this.journalService.createFromSaleInvoices(ids);
      case 'purchaseInvoice':
        return this.journalService.createFromPurchaseInvoices(ids);
      case 'customerReceipt':
        return this.journalService.createFromCustomerReceipts(ids);
      case 'vendorPayment':
        return this.journalService.createFromVendorPayments(ids);
      case 'contraTransaction':
        return this.journalService.createFromContraTransactions(ids);
    }
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
      order: filter.order?.length ? filter.order : DEFAULT_JOURNAL_ORDER,
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

  protected canUnlink(journal: Journal): boolean {
    const match = this.sourceMatchByJournalId().get(journal.id);
    return !!match && this.permissions.can(this.reconciliationDeletePermission(match.sourcetype));
  }

  protected unlinkSourceTypeLabel(journal: Journal): string {
    const match = this.sourceMatchByJournalId().get(journal.id);
    return this.getSourceTypeLabel(match?.sourcetype ?? journal.sourcetype);
  }

  protected openUnlinkConfirm(journal: Journal): void {
    if (!this.canUnlink(journal) || this.unlinkingJournalId()) return;
    this.pendingUnlinkJournal.set(journal);
  }

  protected closeUnlinkConfirm(): void {
    if (this.unlinkingJournalId()) return;
    this.pendingUnlinkJournal.set(null);
  }

  protected async confirmUnlink(): Promise<void> {
    const journal = this.pendingUnlinkJournal();
    const journalId = journal?.id;
    const match = journalId ? this.sourceMatchByJournalId().get(journalId) : undefined;
    if (!journal || !journalId || !match || this.unlinkingJournalId() || !this.canUnlink(journal)) {
      return;
    }

    this.unlinkingJournalId.set(journalId);
    this.pendingUnlinkJournal.set(null);

    try {
      const ok = await this.reconciliationMatchFacade.unlinkJournalFromSource(
        match.sourcetype,
        match.sourceid,
        journalId,
      );
      if (ok) {
        this.reloadJournals();
      }
    } finally {
      this.unlinkingJournalId.set(null);
    }
  }

  protected canImportSource(source: JournalImportSource): boolean {
    return (
      this.permissions.can(PERMISSION.fiscalYear.journal.create) &&
      this.permissions.can(this.importSourceViewPermission(source))
    );
  }

  private importSourceViewPermission(source: JournalImportSource): PermissionRequirement {
    switch (source) {
      case 'saleInvoice': return PERMISSION.branch.saleInvoice.view;
      case 'purchaseInvoice': return PERMISSION.branch.purchaseInvoice.view;
      case 'customerReceipt': return PERMISSION.branch.customerReceipt.view;
      case 'vendorPayment': return PERMISSION.branch.vendorPayment.view;
      case 'contraTransaction': return PERMISSION.branch.contraTransaction.view;
    }
  }

  private reconciliationDeletePermissions(): readonly PermissionRequirement[] {
    return [
      PERMISSION.fiscalYear.bankTxnReconciliation.delete,
      PERMISSION.fiscalYear.saleInvoiceReconciliation.delete,
      PERMISSION.fiscalYear.purchaseInvoiceReconciliation.delete,
      PERMISSION.fiscalYear.customerReceiptReconciliation.delete,
      PERMISSION.fiscalYear.vendorPaymentReconciliation.delete,
      PERMISSION.fiscalYear.contraTransactionReconciliation.delete,
    ];
  }

  private reconciliationDeletePermission(
    sourceType: JournalSourceType,
  ): PermissionRequirement {
    switch (sourceType) {
      case JournalSourceType.BANK_TXN: return PERMISSION.fiscalYear.bankTxnReconciliation.delete;
      case JournalSourceType.SALE_INVOICE: return PERMISSION.fiscalYear.saleInvoiceReconciliation.delete;
      case JournalSourceType.PURCHASE_INVOICE: return PERMISSION.fiscalYear.purchaseInvoiceReconciliation.delete;
      case JournalSourceType.RECEIPT: return PERMISSION.fiscalYear.customerReceiptReconciliation.delete;
      case JournalSourceType.PAYMENT: return PERMISSION.fiscalYear.vendorPaymentReconciliation.delete;
      case JournalSourceType.CONTRA_TRANSACTION: return PERMISSION.fiscalYear.contraTransactionReconciliation.delete;
      default: return { level: 'fiscalYear', resource: '__unsupported__', action: 'delete' };
    }
  }

  protected openLedgers(): void {
    void this.router.navigate(['/app/accounting/ledger'], {
      queryParams: { burl: this.router.url },
    });
  }
}
