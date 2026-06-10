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
  TngDialogComponent,
  TngError,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
  TngTabsComponent,
} from '@tailng-ui/components';
import { TngTab, TngTabList, TngTabPanel } from '@tailng-ui/primitives';
import { TngIcon } from '@tailng-ui/icons';
import { ReconciliationMatchFacade } from '../../../../data/reconciliation-match';
import {
  BankTxnService,
  BankTxnStore,
  bankTxnMaxAmount,
  journalBankLedgerMatchedAmount,
  remainingMatchAmount,
  resolveBankLedgerId,
} from '../../../../data/bank-txn';
import type { BankTxn, BankTxnJournal } from '../../../../data/bank-txn';
import { InventoryLedgerMapStore } from '../../../../data/inventory-ledger-map';
import { JournalService } from '../../../../data/journal';
import { JournalAssignAssignedSectionComponent } from '../journal-assign-assigned-section/journal-assign-assigned-section.component';
import { JournalAssignCreateComponent } from '../journal-assign-create/journal-assign-create.component';
import { JournalAssignSelectComponent } from '../journal-assign-select/journal-assign-select.component';
import { JournalAssignLedgerNamesService } from '../shared/journal-assign-ledger-names';
import { formatAmount } from '../shared/journal-assign-table.util';
import type { AssignMode, ExistingAssignment } from '../shared/journal-assign.types';

@Component({
  selector: 'app-journal-assign-dialog',
  standalone: true,
  imports: [
    JournalAssignAssignedSectionComponent,
    JournalAssignCreateComponent,
    JournalAssignSelectComponent,
    TngButtonComponent,
    TngDialogComponent,
    TngError,
    TngFormFieldComponent,
    TngInputComponent,
    TngLabelComponent,
    TngIcon,
    TngTab,
    TngTabList,
    TngTabPanel,
    TngTabsComponent,
  ],
  providers: [JournalAssignLedgerNamesService],
  templateUrl: './journal-assign-dialog.component.html',
  styleUrl: './journal-assign-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalAssignDialogComponent {
  @HostBinding('class.journal-assign-dialog--create')
  get createModeClass(): boolean {
    return this.isCreateMode();
  }

  protected readonly dialogWidth = '70%';
  protected readonly createDialogHeight = 'calc(100vh - 2rem)';

  private readonly bankTxnService = inject(BankTxnService);
  private readonly reconciliationMatchFacade = inject(ReconciliationMatchFacade);
  private readonly journalService = inject(JournalService);
  private readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  private readonly ledgerNames = inject(JournalAssignLedgerNamesService);
  protected readonly bankTxnStore = inject(BankTxnStore);

  private readonly selectPanel = viewChild(JournalAssignSelectComponent);
  private readonly createPanel = viewChild(JournalAssignCreateComponent);

  readonly open = input.required<boolean>();
  readonly bankTxn = input<BankTxn | null>(null);

  readonly closed = output<void>();
  readonly assigned = output<void>();
  readonly assignmentsChanged = output<void>();

  protected readonly mode = signal<AssignMode>('create');
  protected readonly existingAssignments = signal<readonly ExistingAssignment[]>([]);
  protected readonly existingAssignmentsLoading = signal(false);
  protected readonly unassigningJournalId = signal<string | null>(null);

  protected readonly isSaving = computed(
    () =>
      this.bankTxnStore.isLoading() ||
      this.reconciliationMatchFacade.isLoading() ||
      this.unassigningJournalId() !== null ||
      (this.createPanel()?.isBusy() ?? false),
  );

  protected readonly isCreateMode = computed(() => this.mode() === 'create');

  protected readonly dialogDescription = computed(() =>
    this.isCreateMode() ? 'Record journal entries for this bank transaction.' : null,
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

  protected readonly selectValidationError = computed(
    () => (this.isCreateMode() ? null : (this.selectPanel()?.validationError() ?? null)),
  );

  protected readonly matchedAmountError = computed(
    () => (this.isCreateMode() ? (this.createPanel()?.matchedAmountError() ?? null) : null),
  );

  protected readonly matchedAmount = computed(() => this.createPanel()?.matchedAmount() ?? '');

  protected readonly createDraftReady = computed(() => this.createPanel()?.draftReady() ?? false);

  protected readonly selectedJournalCount = computed(
    () => this.selectPanel()?.selectedJournalCount() ?? 0,
  );

  protected readonly selectedMatchedTotal = computed(
    () => this.selectPanel()?.selectedMatchedTotal() ?? 0,
  );

  protected readonly selectCanAssign = computed(() => this.selectPanel()?.canAssign() ?? false);

  protected readonly dialogError = computed(
    () =>
      this.bankTxnStore.error() ??
      this.reconciliationMatchFacade.error() ??
      this.selectPanel()?.error() ??
      null,
  );

  protected formatAmount = formatAmount;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      const txn = this.bankTxn();
      if (!isOpen || !txn) return;

      untracked(() => {
        this.mode.set('create');
        this.existingAssignments.set([]);
        this.existingAssignmentsLoading.set(false);
        this.unassigningJournalId.set(null);
        this.bankTxnStore.clearError();
        this.reconciliationMatchFacade.clearError();
        this.ledgerNames.reset();
        void this.loadExistingAssignments(txn);
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
    this.bankTxnStore.clearError();
    this.reconciliationMatchFacade.clearError();
  }

  protected onMatchedAmountChange(value: unknown): void {
    const panel = this.createPanel();
    if (!panel) return;
    panel.matchedAmount.set(String(value ?? ''));
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

      await this.loadExistingAssignments(txn);
      this.assignmentsChanged.emit();
    } finally {
      this.unassigningJournalId.set(null);
    }
  }

  protected async onAssignSelected(): Promise<void> {
    await this.selectPanel()?.assign();
  }

  protected async onCreateJournal(): Promise<void> {
    await this.createPanel()?.create();
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
}
