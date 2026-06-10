import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  TngButtonComponent,
  TngButtonToggleComponent,
  TngButtonToggleGroupComponent,
  TngCheckboxComponent,
  TngDialogComponent,
  TngError,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn, TngTableRowClassFn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { ReconciliationMatchFacade } from '../../../data/reconciliation-match';
import {
  BankTxnFacade,
  BankTxnService,
  BankTxnStore,
  bankTxnMaxAmount,
  buildJournalDateRangeWhere,
  buildJournalOutsideDateRangeWhere,
  getCompatibleJournalCandidates,
  JOURNAL_ASSIGN_DATE_RANGE_DAYS,
  journalBankLedgerMatchedAmount,
  remainingMatchAmount,
  resolveBankLedgerId,
} from '../../../data/bank-txn';
import type { BankTxn, BankTxnJournal, JournalMatchCandidate } from '../../../data/bank-txn';
import { InventoryLedgerMapStore } from '../../../data/inventory-ledger-map';
import { JournalService } from '../../../data/journal';
import type { Journal, JournalEntry } from '../../../data/journal';
import { LedgerService } from '../../../data/ledger/ledger.service';
import type { Ledger } from '../../../data/ledger';
import { LedgerStore } from '../../../data/ledger';
import { JournalCreateDraftStagingService } from '../../journal/create-journal/journal-create-draft-staging.service';
import { JournalCreateFormComponent } from '../../journal/create-journal/journal-create-form/journal-create-form.component';
import type { Lb4Where } from '../../../../../../shared/crud/lb4-query';

type AssignMode = 'select' | 'create';

type ExistingAssignment = Readonly<{
  journal: Journal;
  matchedAmount: number;
}>;

type AssignJournalTableRow = Readonly<{
  credit: number | null | undefined;
  date: string;
  debit: number | null | undefined;
  defaultMatchedAmount: number;
  description: string;
  entry: JournalEntry | null;
  journal: Journal;
  journalGroupKey: string;
  ledgerid: string;
  matchedAmount: number;
  number: string;
  rowKey: string;
}>;

function parseMatchedAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

@Component({
  selector: 'app-journal-assign-dialog',
  standalone: true,
  imports: [
    EmptyStateComponent,
    JournalCreateFormComponent,
    TngButtonComponent,
    TngButtonToggleComponent,
    TngButtonToggleGroupComponent,
    TngCheckboxComponent,
    TngDialogComponent,
    TngError,
    TngFormFieldComponent,
    TngInputComponent,
    TngLabelComponent,
    TngIcon,
    TableRowIconButtonComponent,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './journal-assign-dialog.component.html',
  styleUrl: './journal-assign-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalAssignDialogComponent {
  @HostBinding('class.journal-assign-dialog--create')
  get createModeClass(): boolean {
    return this.isCreateMode();
  }

  protected readonly createDialogWidth = '70%';
  protected readonly createDialogHeight = 'calc(100vh - 2rem)';
  protected readonly selectDialogWidth = 'min(72rem, calc(100vw - 2rem))';
  protected readonly JOURNAL_ASSIGN_DATE_RANGE_DAYS = JOURNAL_ASSIGN_DATE_RANGE_DAYS;

  private readonly bankTxnFacade = inject(BankTxnFacade);
  private readonly bankTxnService = inject(BankTxnService);
  private readonly reconciliationMatchFacade = inject(ReconciliationMatchFacade);
  private readonly journalService = inject(JournalService);
  private readonly ledgerService = inject(LedgerService);
  private readonly ledgerStore = inject(LedgerStore);
  private readonly journalDraftStaging = inject(JournalCreateDraftStagingService);
  private readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly bankTxnStore = inject(BankTxnStore);

  protected readonly journalForm = viewChild(JournalCreateFormComponent);

  readonly open = input.required<boolean>();
  readonly bankTxn = input<BankTxn | null>(null);

  readonly closed = output<void>();
  readonly assigned = output<void>();
  readonly assignmentsChanged = output<void>();

  protected readonly mode = signal<AssignMode>('select');
  protected readonly matchedAmount = signal('');
  protected readonly submitted = signal(false);
  protected readonly createDraftReady = signal(false);
  protected readonly candidatesLoading = signal(false);
  protected readonly candidatesLoadingMore = signal(false);
  protected readonly candidatesError = signal<string | null>(null);
  protected readonly hasMoreCandidates = signal(false);
  protected readonly candidates = signal<readonly JournalMatchCandidate[]>([]);
  protected readonly existingAssignments = signal<readonly ExistingAssignment[]>([]);
  protected readonly existingAssignmentsLoading = signal(false);
  protected readonly unassigningJournalId = signal<string | null>(null);
  protected readonly selectedJournalIds = signal<ReadonlySet<string>>(new Set());
  protected readonly journalMatchAmounts = signal<ReadonlyMap<string, string>>(new Map());
  private readonly ledgerNames = signal(new Map<string, string>());
  private ledgerNameFetchVersion = 0;

  protected readonly assignedColumns: readonly TngTableColumn<AssignJournalTableRow>[] = [
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
      id: 'matchedAmount',
      label: 'Matched amount',
      accessor: 'journalGroupKey',
      align: 'end',
      groupBy: true,
      groupByAlign: 'top',
      headerAlign: 'end',
      width: '10rem',
    },
    {
      id: 'actions',
      label: 'Un-assign',
      accessor: 'journalGroupKey',
      groupBy: true,
      groupByAlign: 'top',
      align: 'end',
      headerAlign: 'end',
      width: '6.5rem',
    },
  ];

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

  protected readonly isSaving = computed(
    () =>
      this.bankTxnStore.isLoading() ||
      this.reconciliationMatchFacade.isLoading() ||
      this.unassigningJournalId() !== null ||
      (this.journalForm()?.isBusy() ?? false),
  );

  protected readonly isCreateMode = computed(() => this.mode() === 'create');

  protected readonly dialogDescription = computed(() =>
    this.isCreateMode()
      ? 'Record journal entries for this bank transaction.'
      : `Select journals within ±${JOURNAL_ASSIGN_DATE_RANGE_DAYS} days of the bank transaction date, or load more.`,
  );

  protected readonly showLoadMore = computed(
    () => this.hasMoreCandidates() && !this.candidatesLoading() && !this.candidatesLoadingMore(),
  );

  protected readonly bankTxnMaxAmount = computed(() => bankTxnMaxAmount(this.bankTxn()));

  protected readonly existingMatchedTotal = computed(() =>
    this.existingAssignments().reduce((sum, assignment) => sum + assignment.matchedAmount, 0),
  );

  protected readonly remainingMatchAmount = computed(() =>
    remainingMatchAmount(this.bankTxn(), this.existingAssignments()),
  );

  protected readonly hasExistingAssignments = computed(
    () => this.existingAssignments().length > 0,
  );

  protected readonly existingAssignmentRows = computed<readonly AssignJournalTableRow[]>(() =>
    this.existingAssignments().flatMap((assignment, index) =>
      this.toAssignJournalRows(
        { journal: assignment.journal, matchedAmount: assignment.matchedAmount },
        index,
        assignment.matchedAmount,
      ),
    ),
  );

  private readonly existingJournalGroupOrder = computed(() => {
    const order = new Map<string, number>();
    let i = 0;
    for (const row of this.existingAssignmentRows()) {
      if (!order.has(row.journalGroupKey)) order.set(row.journalGroupKey, i++);
    }
    return order;
  });

  protected readonly existingRowClassFn = computed<TngTableRowClassFn<AssignJournalTableRow> | null>(
    () => {
      const order = this.existingJournalGroupOrder();
      return (row) =>
        (order.get(row.journalGroupKey) ?? 0) % 2 === 1 ? 'journal-row--alt' : null;
    },
  );

  protected readonly assignRows = computed<readonly AssignJournalTableRow[]>(() =>
    this.candidates().flatMap((candidate, index) =>
      this.toAssignJournalRows(candidate, index, 0),
    ),
  );

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

  protected readonly selectedAssignments = computed(() => {
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

  protected readonly selectedJournalCount = computed(() => this.selectedJournalIds().size);

  protected readonly selectedMatchedTotal = computed(() =>
    this.selectedAssignments().reduce((sum, assignment) => sum + assignment.matchedAmount, 0),
  );

  protected readonly matchedAmountError = computed(() => {
    if (!this.submitted() || !this.isCreateMode()) return null;

    const parsed = parseMatchedAmount(this.matchedAmount());
    if (parsed === null) {
      return 'Matched amount must be a positive number.';
    }

    const remaining = this.remainingMatchAmount();
    if (remaining <= 0) {
      return 'This bank transaction is already fully matched.';
    }

    if (parsed > remaining) {
      return `Matched amount cannot exceed ${remaining}.`;
    }

    return null;
  });

  protected readonly selectValidationError = computed(() => {
    if (!this.submitted() || this.mode() !== 'select') return null;

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
      return `Total matched amount cannot exceed ${remaining}.`;
    }

    return null;
  });

  protected readonly dialogError = computed(
    () =>
      this.bankTxnStore.error() ??
      this.reconciliationMatchFacade.error() ??
      this.candidatesError() ??
      null,
  );

  constructor() {
    effect(() => {
      const isOpen = this.open();
      const txn = this.bankTxn();
      if (!isOpen || !txn) return;

      untracked(() => {
        this.mode.set('select');
        this.submitted.set(false);
        this.createDraftReady.set(false);
        this.selectedJournalIds.set(new Set());
        this.journalMatchAmounts.set(new Map());
        this.matchedAmount.set('');
        this.candidates.set([]);
        this.existingAssignments.set([]);
        this.existingAssignmentsLoading.set(false);
        this.candidatesError.set(null);
        this.hasMoreCandidates.set(false);
        this.unassigningJournalId.set(null);
        this.bankTxnStore.clearError();
        this.reconciliationMatchFacade.clearError();
        void this.loadDialogData(txn);
      });
    });

    effect(() => {
      if (!this.open() || this.mode() !== 'create') return;

      const txn = this.bankTxn();
      if (!txn || this.createDraftReady()) return;

      untracked(() => {
        void this.ensureCreateDraft(txn);
      });
    });

    effect(() => {
      if (!this.open() || this.mode() !== 'create') return;

      const remaining = this.remainingMatchAmount();
      untracked(() => {
        this.matchedAmount.set(remaining > 0 ? String(remaining) : '');
        this.submitted.set(false);
      });
    });
  }

  protected onDialogClosed(): void {
    if (this.isSaving()) return;
    this.closed.emit();
  }

  protected onCancelled(): void {
    this.closed.emit();
  }

  protected onModeChange(value: unknown): void {
    const next = value === 'create' ? 'create' : 'select';
    this.mode.set(next);
    this.submitted.set(false);
    this.bankTxnStore.clearError();
    this.reconciliationMatchFacade.clearError();
  }

  protected async onUnassign(journalId: string): Promise<void> {
    const txn = this.bankTxn();
    const bankTxnId = txn?.id;
    if (!bankTxnId || this.isSaving()) return;

    this.unassigningJournalId.set(journalId);
    this.reconciliationMatchFacade.clearError();

    try {
      const ok = await this.reconciliationMatchFacade.unlinkJournalFromBankTxn(
        bankTxnId,
        journalId,
      );
      if (!ok) return;

      await this.loadDialogData(txn);
      this.assignmentsChanged.emit();
    } finally {
      this.unassigningJournalId.set(null);
    }
  }

  protected isSelected(journalId: string): boolean {
    return this.selectedJournalIds().has(journalId);
  }

  protected toggleCandidate(journalId: string, checked: boolean, defaultAmount = 0): void {
    const nextSelected = new Set(this.selectedJournalIds());
    const nextAmounts = new Map(this.journalMatchAmounts());

    if (checked) {
      nextSelected.add(journalId);
      if (!parseMatchedAmount(nextAmounts.get(journalId) ?? '') && defaultAmount > 0) {
        nextAmounts.set(journalId, String(defaultAmount));
      }
    } else {
      nextSelected.delete(journalId);
    }

    this.selectedJournalIds.set(nextSelected);
    this.journalMatchAmounts.set(nextAmounts);
    this.submitted.set(false);
  }

  protected async loadMoreCandidates(): Promise<void> {
    const txn = this.bankTxn();
    if (!txn || this.candidatesLoadingMore() || !this.hasMoreCandidates()) return;

    this.candidatesLoadingMore.set(true);
    this.candidatesError.set(null);

    try {
      const outsideWhere = buildJournalOutsideDateRangeWhere(txn.txndate);
      const more = await this.fetchCompatibleCandidates(txn, outsideWhere);
      this.candidates.set(this.mergeCandidates(this.candidates(), more));
      this.hasMoreCandidates.set(false);
      void this.fetchLedgerNames(this.collectLedgerIds(more.map((item) => item.journal)));
    } catch {
      this.candidatesError.set('Failed to load more journals.');
    } finally {
      this.candidatesLoadingMore.set(false);
    }
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

  protected formatAmount(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value);
  }

  protected getLedgerName(ledgerid: string): string {
    return this.ledgerNames().get(ledgerid) ?? ledgerid;
  }

  protected async onAssignSelected(): Promise<void> {
    this.submitted.set(true);
    if (this.selectValidationError()) return;

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

  protected async onCreateJournal(): Promise<void> {
    this.submitted.set(true);
    if (this.matchedAmountError()) return;

    const form = this.journalForm();
    if (!form) return;

    const payload = form.buildPayload();
    if (!payload) return;

    const bankTxnId = this.bankTxn()?.id;
    const matchedamount = parseMatchedAmount(this.matchedAmount());
    if (!bankTxnId || matchedamount === null) return;

    const journal = await this.bankTxnFacade.createJournalForBankTxn(bankTxnId, {
      ...payload,
      matchedamount,
    });
    if (!journal?.id) return;
    if (!(await form.attachPendingDocuments(journal.id, journal))) return;

    this.assigned.emit();
  }

  private async loadDialogData(txn: BankTxn): Promise<void> {
    await this.loadExistingAssignments(txn);
    await this.loadCandidates(txn);
  }

  private async ensureCreateDraft(txn: BankTxn): Promise<void> {
    await this.journalDraftStaging.stageFromBankTxn(txn);
    this.createDraftReady.set(true);
  }

  private async loadExistingAssignments(txn: BankTxn): Promise<void> {
    if (!txn.id) {
      this.existingAssignments.set([]);
      this.existingAssignmentsLoading.set(false);
      return;
    }

    this.existingAssignmentsLoading.set(true);

    try {
      const journalRefs = await this.fetchBankTxnJournalRefs(txn.id);
      if (!journalRefs.length) {
        this.existingAssignments.set([]);
        return;
      }

      const journalIds = journalRefs.map((journal) => journal.id).filter(Boolean);
      const journals = await this.journalService.list({
        where: { id: { inq: journalIds } },
        includes: ['entries'],
        limit: journalIds.length,
      });

      const journalById = new Map(
        journals.filter((journal) => journal.id).map((journal) => [journal.id as string, journal]),
      );

      const bankLedgerId = resolveBankLedgerId(txn, this.inventoryLedgerMapStore.items());
      const assignments = journalRefs.flatMap((ref) => {
        const journal = journalById.get(ref.id);
        if (!journal) return [];

        return [
          {
            journal,
            matchedAmount: journalBankLedgerMatchedAmount(journal, txn, bankLedgerId),
          },
        ];
      });

      this.existingAssignments.set(assignments);
      void this.fetchLedgerNames(this.collectLedgerIds(journals));
    } catch {
      this.existingAssignments.set([]);
    } finally {
      this.existingAssignmentsLoading.set(false);
    }
  }

  private async fetchBankTxnJournalRefs(bankTxnId: string): Promise<readonly BankTxnJournal[]> {
    const items = await this.bankTxnService.list({
      where: { id: bankTxnId },
      limit: 1,
    });
    return items[0]?.journals ?? [];
  }

  private async loadCandidates(txn: BankTxn): Promise<void> {
    if (this.candidatesLoading()) return;

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
      void this.fetchLedgerNames(this.collectLedgerIds(compatible.map((item) => item.journal)));
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

  private toAssignJournalRows(
    candidate: JournalMatchCandidate,
    journalIndex: number,
    displayMatchedAmount: number,
  ): readonly AssignJournalTableRow[] {
    const journal = candidate.journal;
    const entries = this.sortedEntries(journal.entries);
    const groupKey = this.journalGroupKey(journal, journalIndex);
    const common = {
      date: journal.date,
      defaultMatchedAmount: candidate.matchedAmount,
      description: journal.description ?? '',
      journal,
      journalGroupKey: groupKey,
      matchedAmount: displayMatchedAmount,
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

  private sortedEntries(entries: readonly JournalEntry[] | undefined): readonly JournalEntry[] {
    return [...(entries ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  private collectLedgerIds(journals: readonly Journal[]): readonly string[] {
    return [
      ...new Set(
        journals
          .flatMap((journal) => journal.entries ?? [])
          .map((entry) => entry.ledgerid)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
  }

  private async fetchLedgerNames(ids: readonly string[]): Promise<void> {
    const fetchVersion = ++this.ledgerNameFetchVersion;
    const cachedNames = this.resolveCachedLedgerNames(ids);
    this.mergeLedgerNames(cachedNames);

    const missingIds = ids.filter((id) => !cachedNames.has(id));
    if (!missingIds.length) return;

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
}
