import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngMenuComponent,
  TngMenuTriggerFor,
  TngProgressSpinnerComponent,
  TngTable,
  TngTableCellTpl,
  TngTooltipComponent,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { CanDirective } from '../../../../../../core/permissions/can.directive';
import { PERMISSION } from '../../../../../../core/permissions/permission-requirements';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import { TngMenuItem } from '@tailng-ui/primitives';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
  createCrudUnfilteredTotalCounter,
} from '../../../../../../shared/crud';
import type { CrudFilterField, Lb4ListQuery } from '../../../../../../shared/crud';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { BankCashStore } from '../../../../trading/data/bank-cash';
import { InventoryLedgerMapStore } from '../../../data/inventory-ledger-map';
import type { InventoryLedgerMap } from '../../../data/inventory-ledger-map';
import { JournalSourceType } from '../../../data/journal';
import { ReconciliationMatchService } from '../../../data/reconciliation-match';
import { BankTxnService, BankTxnStore } from '../../../data/bank-txn';
import type { BankTxn, BankTxnJournal, BankTxnOpeningBalance } from '../../../data/bank-txn';
import {
  getOpeningBalanceForBank,
  hasDateLowerBound,
  periodFromFilter,
  stripPaginationFromQuery,
} from '../../../data/bank-txn/bank-txn-running-balance.util';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { BankStatementUploadComponent } from '../bank-statement-upload/bank-statement-upload.component';
import { JournalCreateDraftStagingService } from '../../journal/create-journal/journal-create-draft-staging.service';
import { JournalAssignDialogComponent } from '../journal-assign-dialog/journal-assign-dialog/journal-assign-dialog.component';
import {
  JOURNAL_LINK_STATUS_FILTER_CLEAR_QUERY_PARAMS,
  JOURNAL_LINK_STATUS_FILTER_FIELD,
} from '../../../shared/journal-link-status-filter';

import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
@Component({
  selector: 'app-list-bank-txn',
  standalone: true,
  imports: [
    CanDirective,
    PageHeadingComponent,
    BurlBackButtonComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    EmptyStateComponent,
    TngMenuComponent,
    TngMenuTriggerFor,
    TngMenuItem,
    TngProgressSpinnerComponent,
    TngTable,
    TngTableCellTpl,
    TngTooltipComponent,
    BankStatementUploadComponent,
    JournalAssignDialogComponent,
  ],
  templateUrl: './list-bank-txn.component.html',
  styleUrl: './list-bank-txn.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListBankTxnComponent {
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionsStore);
  private readonly dateManagement = inject(DateManagementService);
  private readonly reconciliationMatchService = inject(ReconciliationMatchService);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly bankTxnStore = inject(BankTxnStore);
  protected readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  protected readonly bankCashStore = inject(BankCashStore);
  private readonly bankTxnService = inject(BankTxnService);
  private readonly journalDraftStaging = inject(JournalCreateDraftStagingService);
  protected readonly hasError = computed(() => this.bankTxnStore.error() !== null);
  protected readonly canAssignJournal = computed(() =>
    this.permissions.can(PERMISSION.fiscalYear.bankTxnReconciliation.create) &&
    (
      this.permissions.can(PERMISSION.fiscalYear.journal.create) ||
      this.permissions.can(PERMISSION.fiscalYear.journal.view)
    ),
  );
  protected readonly filterClearQueryParams = JOURNAL_LINK_STATUS_FILTER_CLEAR_QUERY_PARAMS;
  private readonly unfilteredTotalCounter = createCrudUnfilteredTotalCounter((query) =>
    this.bankTxnService.count(query),
  );
  protected readonly unfilteredTotalItems = this.unfilteredTotalCounter.totalItems;
  protected readonly pageTitle = computed(() => 'Banking');
  protected readonly pageDescription = computed(
    () => 'Manage bank statement transactions for reconciliation and audit trails.',
  );

  protected readonly journalDialogOpen = signal(false);
  protected readonly journalDialogBankTxn = signal<BankTxn | null>(null);
  protected readonly journalsLoading = signal(false);
  protected readonly journalsByBankTxnId = signal<Map<string, readonly BankTxnJournal[]>>(
    new Map(),
  );

  protected readonly columns = computed<readonly TngTableColumn<BankTxn>[]>(() => [
    { id: 'txndate', label: 'Date', width: '9rem' },
    { id: 'bank', label: 'Bank', width: '14rem' },
    {
      id: 'debit',
      label: 'Deposit',
      align: 'end',
      headerAlign: 'end',
      width: '9rem',
    },
    {
      id: 'credit',
      label: 'Withdrawal',
      align: 'end',
      headerAlign: 'end',
      width: '9rem',
    },
    {
      id: 'balance',
      label: 'Balance',
      align: 'end',
      headerAlign: 'end',
      width: '9rem',
    },
    { id: 'description', label: 'Description', truncate: true },
    { id: 'bankref', label: 'Reference', width: '12rem' },
    { id: 'journals', label: 'Journals', width: '12rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '5rem' },
  ]);

  protected readonly useClientPagination = computed(() =>
    hasDateLowerBound(this.filterWhere()),
  );

  protected readonly tableRows = computed(() => {
    const rows = this.bankTxnStore.items();
    if (!this.useClientPagination()) {
      return rows;
    }

    const filter = this.crudQuery.filter();
    const offset = filter.offset ?? 0;
    const limit = filter.limit ?? 10;
    return rows.slice(offset, offset + limit);
  });

  protected readonly paginatorTotalItems = computed(() =>
    this.useClientPagination() ? this.bankTxnStore.items().length : this.bankTxnStore.count(),
  );

  protected readonly summaryMetrics = computed(() => {
    const openingBalances = this.bankTxnStore.openingBalances();
    const filteredBankId = this.filteredBankMapId();

    if (filteredBankId) {
      const balance = getOpeningBalanceForBank(openingBalances, filteredBankId);

      return [
        {
          id: filteredBankId,
          label: this.openingBalanceLabel(
            { inventoryledgermapid: filteredBankId, balance },
            filteredBankId,
          ),
          value: this.formatBalance(balance),
        },
      ];
    }

    const entries =
      openingBalances.length > 0
        ? openingBalances
        : this.uniqueBankMapIdsFromItems().map((mapId) => ({
            inventoryledgermapid: mapId,
            balance: getOpeningBalanceForBank(openingBalances, mapId),
          }));

    if (entries.length === 0) {
      return [
        {
          id: 'opening-balance',
          label: 'Opening balance',
          value: this.formatBalance(0),
        },
      ];
    }

    return entries.map((entry) => ({
      id: entry.inventoryledgermapid,
      label: this.openingBalanceLabel(entry, filteredBankId),
      value: this.formatBalance(entry.balance),
    }));
  });

  protected readonly summaryPeriodLabel = computed(() =>
    this.periodLabel(this.effectivePeriod()),
  );

  protected readonly showOpeningSummary = computed(() => this.summaryMetrics().length > 0);

  protected readonly showTableContent = computed(() => {
    if (this.bankTxnStore.isLoading() || this.hasError()) {
      return true;
    }

    const itemCount = this.bankTxnStore.items().length;
    const totalCount = this.paginatorTotalItems();
    if (itemCount > 0 || this.crudQuery.shouldShowEmptyState(itemCount, totalCount)) {
      return true;
    }

    return this.showOpeningSummary();
  });

  protected readonly bankLedgerMapOptionValue = (option: unknown): string =>
    (option as InventoryLedgerMap).id ?? '';
  protected readonly bankLedgerMapOptionLabel = (option: unknown): string => {
    const map = option as InventoryLedgerMap;

    return (map.id ? this.bankNameByMapId().get(map.id) : '') || map.id || '';
  };
  protected readonly bankLedgerMapTrackBy = (_index: number, option: unknown): unknown => {
    const map = option as InventoryLedgerMap;

    return map.id ?? map.entityid ?? map.ledgerid;
  };

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'txndate', label: 'Date', defaultOperator: 'between', type: 'date' },
    {
      id: 'debit',
      label: 'Deposit',
      placeholder: 'Amount',
      step: '0.01',
      type: 'number',
      operators: ['between', '=', '>=', '<='],
    },
    {
      id: 'credit',
      label: 'Withdrawal',
      placeholder: 'Amount',
      step: '0.01',
      type: 'number',
      operators: ['between', '=', '>=', '<='],
    },
    { id: 'bankref', label: 'Reference', placeholder: 'UTR / cheque no', type: 'text' },
    { id: 'description', label: 'Description', placeholder: 'Narration text', type: 'text' },
    JOURNAL_LINK_STATUS_FILTER_FIELD,
    {
      id: 'inventoryledgermapid',
      label: 'Bank',
      placeholder: 'Search bank/cash',
      type: 'autocomplete',
      options: () => this.inventoryLedgerMapStore.items(),
      getOptionValue: this.bankLedgerMapOptionValue,
      getOptionLabel: this.bankLedgerMapOptionLabel,
      trackBy: this.bankLedgerMapTrackBy,
    },
  ];

  private readonly bankCashNameById = computed(() => {
    const map = new Map<string, string>();
    for (const bank of this.bankCashStore.items()) {
      if (bank.id) map.set(bank.id, bank.name);
    }
    return map;
  });

  private readonly bankNameByMapId = computed(() => {
    const banksById = this.bankCashNameById();
    return new Map(
      this.inventoryLedgerMapStore
        .items()
        .filter((map) => map.id)
        .map((map) => [map.id as string, map.entityid ? (banksById.get(map.entityid) ?? '') : '']),
    );
  });

  constructor() {
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    await Promise.all([
      this.inventoryLedgerMapStore.loadInventoryLedgerMaps({
        limit: 1000,
        offset: 0,
        where: { entitytype: 'bankCash' },
      }),
      this.bankCashStore.loadBankCashes({ limit: 1000, offset: 0 }),
    ]);

    this.crudQuery.init((filter) => this.loadBankTxnsWithJournals(filter));
  }

  private async loadBankTxnsWithJournals(filter: Lb4ListQuery): Promise<void> {
    void this.unfilteredTotalCounter.refresh(filter);

    const listQuery = hasDateLowerBound(filter.where as Record<string, unknown> | undefined)
      ? stripPaginationFromQuery({
          ...filter,
          includes: ['inventoryledgermap'],
        })
      : {
          ...filter,
          includes: ['inventoryledgermap'],
        };

    await this.bankTxnStore.loadBankTxns(listQuery);
    if (this.bankTxnStore.error()) {
      this.journalsByBankTxnId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }
    await this.loadLinkedJournals(this.tableRows());
  }

  private async loadLinkedJournals(txns: readonly BankTxn[]): Promise<void> {
    if (!this.permissions.can(PERMISSION.fiscalYear.journal.view)) {
      this.journalsByBankTxnId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }
    const ids = txns.map((txn) => txn.id).filter((id): id is string => Boolean(id));
    if (!ids.length) {
      this.journalsByBankTxnId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }

    this.journalsLoading.set(true);
    try {
      const groups = await this.reconciliationMatchService.findJournalsBySourceIds(
        JournalSourceType.BANK_TXN,
        ids,
      );
      const map = new Map<string, readonly BankTxnJournal[]>();
      for (const group of groups) {
        map.set(group.sourceid, group.journals);
      }
      this.journalsByBankTxnId.set(map);
    } catch {
      this.journalsByBankTxnId.set(new Map());
    } finally {
      this.journalsLoading.set(false);
    }
  }

  protected createBankTxn(): void {
    void this.router.navigate(['/app/accounting/banking/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewBankTxn(item: BankTxn): void {
    if (item.id) {
      void this.router.navigate(['/app/accounting/banking', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editBankTxn(item: BankTxn): void {
    if (item.id) {
      void this.router.navigate(['/app/accounting/banking', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteBankTxn(item: BankTxn): void {
    if (item.id) {
      void this.router.navigate(['/app/accounting/banking', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected createContraEntry(item: BankTxn): void {
    const debit = Number(item.debit ?? 0);
    const credit = Number(item.credit ?? 0);
    const queryParams: Record<string, string> = { burl: this.router.url };

    const txndate = item.txndate?.trim();
    if (txndate) {
      queryParams['date'] = txndate;
    }

    const amount = debit > 0 ? debit : credit > 0 ? credit : null;
    if (amount !== null && Number.isFinite(amount) && amount > 0) {
      queryParams['amount'] = String(amount);
    }

    const description = item.description?.trim();
    if (description) {
      queryParams['description'] = description;
    }

    const bankCashId = item.inventoryledgermap?.entityid?.trim();
    if (bankCashId) {
      if (debit > 0) {
        queryParams['tobcashid'] = bankCashId;
      } else if (credit > 0) {
        queryParams['frombcashid'] = bankCashId;
      }
    }

    void this.router.navigate(['/app/trading/bank-cash/contra/create'], { queryParams });
  }

  protected linkedJournals(item: BankTxn): readonly BankTxnJournal[] {
    const id = item.id;
    if (!id) return [];
    return this.journalsByBankTxnId().get(id) ?? [];
  }

  protected hasJournals(item: BankTxn): boolean {
    return this.linkedJournals(item).length > 0;
  }

  protected assignJournal(item: BankTxn): void {
    if (!item.id || !this.canAssignJournal()) return;

    this.journalDialogBankTxn.set(item);
    this.journalDialogOpen.set(true);
  }

  protected closeJournalDialog(): void {
    this.journalDialogOpen.set(false);
    this.journalDialogBankTxn.set(null);
    this.journalDraftStaging.clear();
  }

  protected onJournalAssigned(): void {
    this.closeJournalDialog();
    this.reloadBankTxns();
  }

  protected async onAssignmentsChanged(): Promise<void> {
    const id = this.journalDialogBankTxn()?.id;
    const filter = this.crudQuery.filter();
    const listQuery = hasDateLowerBound(filter.where as Record<string, unknown> | undefined)
      ? stripPaginationFromQuery({
          ...filter,
          includes: ['inventoryledgermap'],
        })
      : {
          ...filter,
          includes: ['inventoryledgermap'],
        };

    await this.bankTxnStore.loadBankTxns(listQuery);
    await this.loadLinkedJournals(this.tableRows());

    if (!id) return;

    const updated = this.tableRows().find((item) => item.id === id) ?? null;
    if (updated) {
      this.journalDialogBankTxn.set(updated);
    }
  }

  protected viewJournal(journal: BankTxnJournal): void {
    if (!this.permissions.can(PERMISSION.fiscalYear.journal.view)) return;
    void this.router.navigate(['/app/accounting/journal', journal.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected reloadBankTxns(): void {
    void this.loadBankTxnsWithJournals(this.crudQuery.filter());
  }

  protected bankName(item: BankTxn): string {
    const mapId = item.inventoryledgermapid;
    const entityId = item.inventoryledgermap?.entityid;

    if (entityId) {
      return this.bankCashNameById().get(entityId) ?? this.bankNameByMapId().get(mapId) ?? mapId;
    }

    const fromMap = this.bankNameByMapId().get(mapId);
    return fromMap || mapId;
  }

  protected descriptionText(value: string | undefined): string {
    return value ?? '';
  }

  protected isLongDescription(value: string | undefined): boolean {
    return this.descriptionText(value).length > 20;
  }

  protected truncatedDescription(value: string | undefined): string {
    const description = this.descriptionText(value);
    return this.isLongDescription(description) ? `${description.slice(0, 20)}...` : description;
  }

  protected formatDisplayDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected formatAmount(value: number | undefined): string {
    const amount = Number(value ?? 0);
    return amount > 0
      ? new Intl.NumberFormat('en-IN', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }).format(amount)
      : '';
  }

  protected formatBalance(value: number | undefined): string {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(Number(value ?? 0));
  }

  private filterWhere(): Record<string, unknown> | undefined {
    return this.crudQuery.filter().where as Record<string, unknown> | undefined;
  }

  private effectivePeriod(): { startDate?: string; endDate?: string } | null {
    return this.bankTxnStore.period() ?? periodFromFilter(this.filterWhere());
  }

  private uniqueBankMapIdsFromItems(): readonly string[] {
    const ids = new Set<string>();
    for (const item of this.bankTxnStore.items()) {
      if (item.inventoryledgermapid) {
        ids.add(item.inventoryledgermapid);
      }
    }
    return [...ids];
  }

  private filteredBankMapId(): string | null {
    const mapId = this.crudQuery.filter().where?.['inventoryledgermapid'];
    return typeof mapId === 'string' && mapId.length > 0 ? mapId : null;
  }

  private openingBalanceLabel(
    entry: BankTxnOpeningBalance,
    filteredBankId: string | null,
  ): string {
    if (filteredBankId) {
      return 'Opening balance';
    }

    const bankName = this.bankNameByMapId().get(entry.inventoryledgermapid);
    return bankName ? `Opening balance (${bankName})` : 'Opening balance';
  }

  private periodLabel(period: { startDate?: string; endDate?: string } | null): string | null {
    if (!period?.startDate) return null;

    const start = this.dateManagement.formatDisplayDate(period.startDate, period.startDate);
    if (!period.endDate) {
      return `From ${start}`;
    }

    const end = this.dateManagement.formatDisplayDate(period.endDate, period.endDate);
    return `${start} – ${end}`;
  }
}
