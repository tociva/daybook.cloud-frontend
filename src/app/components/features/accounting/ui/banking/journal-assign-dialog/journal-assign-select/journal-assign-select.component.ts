import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  TngButtonComponent,
  TngCheckboxComponent,
  TngInputComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn, TngTableRowClassFn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { EmptyStateComponent } from '../../../../../../../shared/empty-state';
import { DateManagementService } from '../../../../../../../core/date/date-management.service';
import { PERMISSION } from '../../../../../../../core/permissions/permission-requirements';
import { PermissionsStore } from '../../../../../../../core/permissions/permissions.store';
import { ReconciliationMatchFacade } from '../../../../data/reconciliation-match';
import {
  buildJournalDateRangeWhere,
  buildJournalOutsideDateRangeWhere,
  getCompatibleJournalCandidates,
  JOURNAL_ASSIGN_DATE_RANGE_DAYS,
  remainingMatchAmount,
  resolveBankLedgerId,
} from '../../../../data/bank-txn';
import type { BankTxn, JournalMatchCandidate } from '../../../../data/bank-txn';
import { InventoryLedgerMapStore } from '../../../../data/inventory-ledger-map';
import { JournalService } from '../../../../data/journal';
import type { Lb4Where } from '../../../../../../../shared/crud/lb4-query';
import { JournalAssignLedgerNamesService } from '../shared/journal-assign-ledger-names';
import {
  collectLedgerIds,
  defaultMatchAmountForJournalSelection,
  formatAmount,
  parseMatchedAmount,
  toAssignJournalRows,
} from '../shared/journal-assign-table.util';
import type { AssignJournalTableRow, ExistingAssignment } from '../shared/journal-assign.types';

type SelectEmptyState =
  | 'fullyMatched'
  | 'noCompatible'
  | 'noInDateRange'
  | 'noMoreToAssign';

@Component({
  selector: 'app-journal-assign-select',
  standalone: true,
  imports: [
    EmptyStateComponent,
    TngButtonComponent,
    TngCheckboxComponent,
    TngIcon,
    TngInputComponent,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './journal-assign-select.component.html',
  styleUrl: './journal-assign-select.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalAssignSelectComponent {
  private readonly dateManagement = inject(DateManagementService);
  private readonly permissions = inject(PermissionsStore);
  private readonly journalService = inject(JournalService);
  private readonly reconciliationMatchFacade = inject(ReconciliationMatchFacade);
  private readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  private readonly ledgerNames = inject(JournalAssignLedgerNamesService);

  readonly dialogOpen = input(false);
  readonly bankTxn = input<BankTxn | null>(null);
  readonly existingAssignments = input<readonly ExistingAssignment[]>([]);
  readonly active = input(false);

  readonly assigned = output<void>();

  protected readonly JOURNAL_ASSIGN_DATE_RANGE_DAYS = JOURNAL_ASSIGN_DATE_RANGE_DAYS;

  private readonly candidatesLoading = signal(false);
  private readonly candidatesLoadingMore = signal(false);
  private readonly candidatesError = signal<string | null>(null);
  private readonly hasMoreCandidates = signal(false);
  private readonly candidates = signal<readonly JournalMatchCandidate[]>([]);
  private readonly selectedJournalIds = signal<ReadonlySet<string>>(new Set());
  private readonly journalMatchAmounts = signal<ReadonlyMap<string, string>>(new Map());
  private readonly submitted = signal(false);

  protected readonly assignColumns: readonly TngTableColumn<AssignJournalTableRow>[] = [
    {
      id: 'selected',
      label: '',
      accessor: 'journalGroupKey',
      groupBy: true,
      groupByAlign: 'top',
      width: '2.75rem',
    },
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
      id: 'matchAmount',
      label: 'Match amount',
      accessor: 'journalGroupKey',
      align: 'end',
      groupBy: true,
      groupByAlign: 'top',
      headerAlign: 'end',
      width: '10rem',
    },
  ];

  protected readonly loading = this.candidatesLoading.asReadonly();
  protected readonly loadingMore = this.candidatesLoadingMore.asReadonly();
  readonly error = this.candidatesError.asReadonly();

  protected readonly showLoadMore = computed(
    () =>
      this.hasMoreCandidates() && !this.candidatesLoading() && !this.candidatesLoadingMore(),
  );

  protected readonly hasExistingAssignments = computed(
    () => this.existingAssignments().length > 0,
  );

  protected readonly remainingMatchAmount = computed(() =>
    remainingMatchAmount(this.bankTxn(), this.existingAssignments()),
  );

  protected readonly assignRows = computed<readonly AssignJournalTableRow[]>(() =>
    this.candidates().flatMap((candidate, index) => toAssignJournalRows(candidate, index, 0)),
  );

  protected readonly emptyState = computed((): SelectEmptyState | null => {
    if (this.candidatesLoading()) return null;

    if (this.remainingMatchAmount() <= 0) return 'fullyMatched';
    if (this.assignRows().length > 0) return null;

    if (this.showLoadMore()) return 'noInDateRange';

    return this.hasExistingAssignments() ? 'noMoreToAssign' : 'noCompatible';
  });

  protected readonly emptyStateTitle = computed(() => {
    switch (this.emptyState()) {
      case 'fullyMatched':
        return 'Fully matched';
      case 'noCompatible':
        return 'No compatible journals';
      case 'noInDateRange':
        return 'No journals in date range';
      case 'noMoreToAssign':
        return 'No additional journals';
      default:
        return '';
    }
  });

  protected readonly emptyStateDescription = computed(() => {
    const days = JOURNAL_ASSIGN_DATE_RANGE_DAYS;
    switch (this.emptyState()) {
      case 'fullyMatched':
        return 'This bank transaction has no remaining amount to match.';
      case 'noCompatible':
        return 'No journals include a matching bank ledger entry for this transaction. Try creating a new journal.';
      case 'noInDateRange':
        return `No journals within ±${days} days. Use Load more journals to search all compatible journals.`;
      case 'noMoreToAssign':
        return 'All compatible journals in range are already assigned or none remain. Use Load more journals if needed.';
      default:
        return '';
    }
  });

  private readonly journalGroupOrder = computed(() => {
    const order = new Map<string, number>();
    let i = 0;
    for (const row of this.assignRows()) {
      if (!order.has(row.journalGroupKey)) order.set(row.journalGroupKey, i++);
    }
    return order;
  });

  protected readonly rowClassFn = computed<TngTableRowClassFn<AssignJournalTableRow> | null>(() => {
    const order = this.journalGroupOrder();
    return (row) => ((order.get(row.journalGroupKey) ?? 0) % 2 === 1 ? 'journal-row--alt' : null);
  });

  private readonly selectedAssignments = computed(() => {
    const selected = this.selectedJournalIds();
    const amounts = this.journalMatchAmounts();
    return this.candidates().flatMap((candidate) => {
      if (!selected.has(candidate.journal.id)) return [];

      const raw = amounts.get(candidate.journal.id) ?? '';
      const parsed = parseMatchedAmount(raw);
      if (parsed === null) return [];

      return [{ ...candidate, matchedAmount: parsed }];
    });
  });

  readonly selectedJournalCount = computed(() => this.selectedJournalIds().size);

  readonly selectedMatchedTotal = computed(() =>
    this.selectedAssignments().reduce((sum, assignment) => sum + assignment.matchedAmount, 0),
  );

  readonly validationError = computed(() => {
    if (!this.submitted()) return null;

    const remaining = this.remainingMatchAmount();
    if (remaining <= 0) {
      return 'This bank transaction is already fully matched.';
    }

    if (this.selectedJournalCount() === 0) {
      return 'Select at least one journal.';
    }

    if (this.selectedAssignments().length !== this.selectedJournalCount()) {
      return 'Enter a match amount for each selected journal.';
    }

    if (this.selectedMatchedTotal() > remaining) {
      return `Total matched amount cannot exceed ${formatAmount(remaining)}.`;
    }

    return null;
  });

  readonly canAssign = computed(
    () =>
      !this.candidatesLoading() &&
      this.remainingMatchAmount() > 0 &&
      this.assignRows().length > 0,
  );

  constructor() {
    effect(() => {
      if (!this.dialogOpen()) return;

      untracked(() => {
        this.reset();
      });
    });

    effect(() => {
      const txn = this.bankTxn();
      const active = this.active();
      this.existingAssignments();

      if (!txn || !active || !this.dialogOpen()) return;

      untracked(() => {
        void this.loadCandidates(txn);
      });
    });
  }

  reset(): void {
    this.submitted.set(false);
    this.selectedJournalIds.set(new Set());
    this.journalMatchAmounts.set(new Map());
    this.candidates.set([]);
    this.candidatesError.set(null);
    this.hasMoreCandidates.set(false);
  }

  async assign(): Promise<void> {
    if (
      !this.permissions.can(PERMISSION.fiscalYear.journal.view) ||
      !this.permissions.can(PERMISSION.fiscalYear.bankTxnReconciliation.create)
    ) return;
    this.submitted.set(true);
    if (this.validationError()) return;

    const bankTxn = this.bankTxn();
    const bankTxnId = bankTxn?.id;
    if (!bankTxnId) return;

    const ok = await this.reconciliationMatchFacade.linkJournalsToBankTxn(
      bankTxnId,
      this.selectedAssignments().map((assignment) => ({
        journalId: assignment.journal.id,
        matchedamount: assignment.matchedAmount,
      })),
    );
    if (!ok) return;

    this.assigned.emit();
  }

  protected isSelected(journalId: string): boolean {
    return this.selectedJournalIds().has(journalId);
  }

  protected toggleCandidate(journalId: string, checked: boolean, defaultAmount = 0): void {
    const nextSelected = new Set(this.selectedJournalIds());
    const nextAmounts = new Map(this.journalMatchAmounts());

    if (checked) {
      nextSelected.add(journalId);
      const selectedDefaultAmount = defaultMatchAmountForJournalSelection(
        nextAmounts.get(journalId) ?? '',
        defaultAmount,
        this.remainingMatchAmount(),
        this.selectedMatchedTotal(),
      );
      if (selectedDefaultAmount) {
        nextAmounts.set(journalId, selectedDefaultAmount);
      }
    } else {
      nextSelected.delete(journalId);
    }

    this.selectedJournalIds.set(nextSelected);
    this.journalMatchAmounts.set(nextAmounts);
    this.submitted.set(false);
  }

  protected async loadMoreCandidates(): Promise<void> {
    if (!this.canLoadCandidates()) return;
    const txn = this.bankTxn();
    if (!txn || this.candidatesLoadingMore() || !this.hasMoreCandidates()) return;

    this.candidatesLoadingMore.set(true);
    this.candidatesError.set(null);

    try {
      const outsideWhere = buildJournalOutsideDateRangeWhere(txn.txndate);
      const more = await this.fetchCompatibleCandidates(txn, outsideWhere);
      this.candidates.set(this.mergeCandidates(this.candidates(), more));
      this.hasMoreCandidates.set(false);
      void this.ledgerNames.fetchLedgerNames(collectLedgerIds(more.map((item) => item.journal)));
    } catch {
      this.candidatesError.set('Failed to load more journals.');
    } finally {
      this.candidatesLoadingMore.set(false);
    }
  }

  private canLoadCandidates(): boolean {
    return (
      this.permissions.can(PERMISSION.fiscalYear.journal.view) &&
      this.permissions.can(PERMISSION.fiscalYear.bankTxnReconciliation.create)
    );
  }

  protected matchAmountFor(journalId: string): string {
    return this.journalMatchAmounts().get(journalId) ?? '';
  }

  protected setMatchAmount(journalId: string, value: unknown): void {
    const next = new Map(this.journalMatchAmounts());
    next.set(journalId, String(value ?? ''));
    this.journalMatchAmounts.set(next);
    this.submitted.set(false);
  }

  protected matchAmountInputId(journalId: string): string {
    return `bank-txn-match-amount-${journalId}`;
  }

  protected formatDisplayDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected formatAmount = formatAmount;

  protected getLedgerName(ledgerid: string): string {
    return this.ledgerNames.getLedgerName(ledgerid);
  }

  private async loadCandidates(txn: BankTxn): Promise<void> {
    if (!this.canLoadCandidates() || this.candidatesLoading()) return;

    this.candidatesLoading.set(true);
    this.candidatesError.set(null);

    try {
      const dateRangeWhere = buildJournalDateRangeWhere(txn.txndate);
      const outsideWhere = buildJournalOutsideDateRangeWhere(txn.txndate);

      const [compatible, outsideCount] = await Promise.all([
        this.fetchCompatibleCandidates(txn, dateRangeWhere),
        outsideWhere
          ? this.journalService.count({ where: outsideWhere })
          : Promise.resolve(0),
      ]);

      this.candidates.set(compatible);
      this.hasMoreCandidates.set(outsideCount > 0);
      this.selectedJournalIds.set(new Set());
      this.journalMatchAmounts.set(new Map());
      void this.ledgerNames.fetchLedgerNames(
        collectLedgerIds(compatible.map((item) => item.journal)),
      );
    } catch {
      this.candidates.set([]);
      this.hasMoreCandidates.set(false);
      this.candidatesError.set('Failed to load compatible journals.');
    } finally {
      this.candidatesLoading.set(false);
    }
  }

  private async fetchCompatibleCandidates(
    txn: BankTxn,
    where?: Lb4Where,
  ): Promise<readonly JournalMatchCandidate[]> {
    const count = await this.journalService.count(where ? { where } : {});
    if (count <= 0) return [];

    const journals = await this.journalService.list({
      includes: ['entries'],
      limit: count,
      order: ['date DESC'],
      ...(where ? { where } : {}),
    });

    const bankLedgerId = resolveBankLedgerId(txn, this.inventoryLedgerMapStore.items());
    const linkedJournalIds = this.existingAssignments().map((assignment) => assignment.journal.id);
    return getCompatibleJournalCandidates(journals, txn, bankLedgerId, linkedJournalIds);
  }

  private mergeCandidates(
    existing: readonly JournalMatchCandidate[],
    incoming: readonly JournalMatchCandidate[],
  ): readonly JournalMatchCandidate[] {
    const seen = new Set(existing.map((candidate) => candidate.journal.id));
    return [
      ...existing,
      ...incoming.filter((candidate) => !seen.has(candidate.journal.id)),
    ];
  }
}
