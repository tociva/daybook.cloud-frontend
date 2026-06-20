import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngProgressSpinnerComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
} from '../../../../../../shared/crud';
import type { CrudFilterField, Lb4ListQuery } from '../../../../../../shared/crud';
import { JournalService, JournalSourceType } from '../../../../accounting/data/journal';
import {
  JOURNAL_LINK_WORK_ITEM_CLEAR_QUERY_PARAMS,
  isJournalLinkWorkItemMode as hasJournalLinkWorkItemMode,
} from '../../../../accounting/data/journal-link-work-item';
import type { JournalLinkWorkItemSourceType } from '../../../../accounting/data/journal-link-work-item';
import { ReconciliationMatchService } from '../../../../accounting/data/reconciliation-match';
import { JournalLinkWorkItemListComponent } from '../../../../accounting/shared/journal-link-work-items';
import { ContraTransactionStore } from '../../../data/contra-transaction';
import type { ContraTransaction, ContraTransactionJournal } from '../../../data/contra-transaction';

@Component({
  selector: 'app-list-bank-contra',
  standalone: true,
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    EmptyStateComponent,
    TngProgressSpinnerComponent,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
    JournalLinkWorkItemListComponent,
  ],
  templateUrl: './list-bank-contra.component.html',
  styleUrl: './list-bank-contra.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListBankContraComponent {
  private readonly dateManagement = inject(DateManagementService);
  private readonly journalService = inject(JournalService);
  private readonly reconciliationMatchService = inject(ReconciliationMatchService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastStore = inject(ToastStore);
  protected readonly contraTransactionStore = inject(ContraTransactionStore);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly hasError = computed(() => this.contraTransactionStore.error() !== null);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly journalLinkWorkItemSourceType: JournalLinkWorkItemSourceType = 'contra';
  protected readonly journalLinkWorkItemClearQueryParams =
    JOURNAL_LINK_WORK_ITEM_CLEAR_QUERY_PARAMS;
  protected readonly isJournalLinkWorkItemMode = computed(() =>
    hasJournalLinkWorkItemMode(this.queryParams(), this.journalLinkWorkItemSourceType),
  );
  protected readonly pageTitle = computed(() =>
    this.isJournalLinkWorkItemMode()
      ? 'Contra transactions pending journal links'
      : 'Bank Contra',
  );
  protected readonly pageDescription = computed(() =>
    this.isJournalLinkWorkItemMode()
      ? 'Review contra transactions that are not fully linked to journals.'
      : 'Move funds between bank and cash accounts.',
  );
  protected readonly generatingJournalContraId = signal<string | null>(null);
  protected readonly journalsLoading = signal(false);
  protected readonly journalsByContraId = signal<Map<string, readonly ContraTransactionJournal[]>>(
    new Map(),
  );

  protected readonly columns: readonly TngTableColumn<ContraTransaction>[] = [
    { id: 'date', label: 'Date', sortable: true, width: '10rem' },
    { id: 'frombcash', label: 'From', width: '14rem' },
    { id: 'tobcash', label: 'To', width: '14rem' },
    {
      id: 'amount',
      label: 'Amount',
      sortable: true,
      align: 'end',
      headerAlign: 'end',
      width: '12rem',
    },
    { id: 'description', label: 'Description', truncate: true },
    { id: 'journals', label: 'Journals', width: '12rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '10rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'date', label: 'Date', defaultOperator: 'between', type: 'date' },
    { id: 'description', label: 'Description', placeholder: 'Search description', type: 'text' },
  ];

  constructor() {
    this.crudQuery.init((filter) => this.loadContraTransactionsWithJournals(filter));
  }

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '-');
  }

  protected formatAmount(row: ContraTransaction): string {
    return formatAmountWithCurrency(row.amount, row.currencycode);
  }

  protected createContra(): void {
    void this.router.navigate(['/app/trading/bank-cash/contra/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected reloadContraTransactions(): void {
    void this.loadContraTransactionsWithJournals(this.crudQuery.filter());
  }

  protected linkedJournals(row: ContraTransaction): readonly ContraTransactionJournal[] {
    const id = row.id;
    if (!id) return [];
    return this.journalsByContraId().get(id) ?? [];
  }

  protected hasJournals(row: ContraTransaction): boolean {
    return this.linkedJournals(row).length > 0;
  }

  protected isGeneratingJournal(row: ContraTransaction): boolean {
    return Boolean(row.id && this.generatingJournalContraId() === row.id);
  }

  protected viewJournal(journal: ContraTransactionJournal): void {
    void this.router.navigate(['/app/accounting/journal', journal.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected async assignJournal(row: ContraTransaction): Promise<void> {
    if (!row.id || this.hasJournals(row) || this.isGeneratingJournal(row)) return;

    this.generatingJournalContraId.set(row.id);
    try {
      const journal = await this.journalService.createFromContraTransaction(row.id);
      this.toastStore.success('Journal generated.');
      const ref: ContraTransactionJournal = { id: journal.id, number: journal.number };
      const map = new Map(this.journalsByContraId());
      map.set(row.id, [ref]);
      this.journalsByContraId.set(map);
    } catch (error) {
      this.toastStore.danger(getApiErrorMessage(error, 'Failed to generate journal.'));
    } finally {
      this.generatingJournalContraId.set(null);
    }
  }

  protected viewContra(item: ContraTransaction): void {
    if (!item.id) return;
    this.contraTransactionStore.setSelectedItem(item);
    void this.router.navigate(['/app/trading/bank-cash/contra', item.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected editContra(item: ContraTransaction): void {
    if (!item.id) return;
    this.contraTransactionStore.setSelectedItem(item);
    void this.router.navigate(['/app/trading/bank-cash/contra', item.id, 'edit'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected deleteContra(item: ContraTransaction): void {
    if (!item.id) return;
    this.contraTransactionStore.setSelectedItem(item);
    void this.router.navigate(['/app/trading/bank-cash/contra', item.id, 'delete'], {
      queryParams: { burl: this.router.url },
    });
  }

  private async loadContraTransactionsWithJournals(filter: Lb4ListQuery): Promise<void> {
    if (this.isJournalLinkWorkItemMode()) {
      this.journalsByContraId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }

    await this.contraTransactionStore.loadContraTransactions({
      ...filter,
      includes: ['frombcash', 'tobcash'],
    });
    if (this.contraTransactionStore.error()) {
      this.journalsByContraId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }
    await this.loadLinkedJournals(this.contraTransactionStore.items());
  }

  private async loadLinkedJournals(contras: readonly ContraTransaction[]): Promise<void> {
    const ids = contras.map((contra) => contra.id).filter((id): id is string => Boolean(id));
    if (!ids.length) {
      this.journalsByContraId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }

    this.journalsLoading.set(true);
    try {
      const groups = await this.reconciliationMatchService.findJournalsBySourceIds(
        JournalSourceType.CONTRA_TRANSACTION,
        ids,
      );
      const map = new Map<string, readonly ContraTransactionJournal[]>();
      for (const group of groups) {
        map.set(group.sourceid, group.journals);
      }
      this.journalsByContraId.set(map);
    } catch {
      this.journalsByContraId.set(new Map());
    } finally {
      this.journalsLoading.set(false);
    }
  }
}
