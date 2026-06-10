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
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { JournalService, JournalSourceType, JournalStore, journalSourceTypeLabel } from '../../../data/journal';
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
  sourcetype: JournalSourceType | string | undefined;
}>;

type JournalImportSource =
  | 'saleInvoice'
  | 'purchaseInvoice'
  | 'customerReceipt'
  | 'vendorPayment';

type JournalImportCandidate = Readonly<{
  id: string;
  amount: number | undefined;
  currencycode: string | undefined;
  date: string;
  number: string;
  party: string;
}>;

type JournalImportConfig = Readonly<{
  actionLabel: string;
  amountLabel: string;
  dialogTitle: string;
  emptyDescription: string;
  emptyTitle: string;
  itemLabel: string;
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
};

@Component({
  selector: 'app-list-journal',
  standalone: true,
  imports: [
    PageHeadingComponent,
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
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
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
  private readonly saleInvoiceService = inject(SaleInvoiceService);
  private readonly purchaseInvoiceService = inject(PurchaseInvoiceService);
  private readonly customerReceiptService = inject(CustomerReceiptService);
  private readonly vendorPaymentService = inject(VendorPaymentService);
  private readonly toastStore = inject(ToastStore);
  protected readonly hasError = computed(() => this.journalStore.error() !== null);
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
    {
      id: 'sourcetype',
      label: 'Type',
      accessor: 'journalGroupKey',
      groupBy: true,
      groupByAlign: 'top',
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

  protected readonly journalImportColumns = computed<readonly TngTableColumn<JournalImportCandidate>[]>(
    () => [
    { id: 'number', label: 'Document', width: '11rem' },
    { id: 'party', label: 'Party', width: '15rem' },
    { id: 'date', label: 'Date', width: '9rem' },
    {
      id: 'amount',
      label: this.journalImportConfig()?.amountLabel ?? 'Amount',
      align: 'end',
      headerAlign: 'end',
      width: '11rem',
    },
  ]);

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
      sourcetype: journal.sourcetype,
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

  protected getSourceTypeLabel(sourcetype: JournalSourceType | string | undefined): string {
    return journalSourceTypeLabel(sourcetype);
  }

  protected sortedEntries(entries: readonly JournalEntry[] | undefined): readonly JournalEntry[] {
    return [...(entries ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  protected formatJournalImportAmount(item: JournalImportCandidate): string {
    return formatAmountWithCurrency(item.amount, item.currencycode);
  }

  protected async openJournalImportDialog(source: JournalImportSource): Promise<void> {
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

    if (!source || !ids.length || this.journalImportGenerating()) return;

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

    const journals = await this.journalService.list({
      limit: sourceIds.length,
      where: {
        sourceid: { inq: sourceIds },
        sourcetype: JOURNAL_IMPORT_CONFIG[source].sourceType,
      },
    });

    return new Set(
      journals
        .map((journal) => journal.sourceid)
        .filter((sourceid): sourceid is string => Boolean(sourceid)),
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
