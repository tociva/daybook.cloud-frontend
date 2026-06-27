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
  viewChild,
} from '@angular/core';
import { BankTxnFacade } from '../../../../data/bank-txn';
import { PERMISSION } from '../../../../../../../core/permissions/permission-requirements';
import { PermissionsStore } from '../../../../../../../core/permissions/permissions.store';
import type { BankTxn } from '../../../../data/bank-txn';
import { JournalCreateDraftStagingService } from '../../../journal/create-journal/journal-create-draft-staging.service';
import { JournalCreateFormComponent } from '../../../journal/create-journal/journal-create-form/journal-create-form.component';
import { formatAmount, formatAmountForInput, parseMatchedAmount } from '../shared/journal-assign-table.util';

@Component({
  selector: 'app-journal-assign-create',
  standalone: true,
  imports: [JournalCreateFormComponent],
  templateUrl: './journal-assign-create.component.html',
  styleUrl: './journal-assign-create.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalAssignCreateComponent {
  private readonly bankTxnFacade = inject(BankTxnFacade);
  private readonly permissions = inject(PermissionsStore);
  private readonly journalDraftStaging = inject(JournalCreateDraftStagingService);

  private readonly journalForm = viewChild(JournalCreateFormComponent);

  readonly dialogOpen = input(false);
  readonly assignmentsLoaded = input(false);
  readonly bankTxn = input<BankTxn | null>(null);
  readonly remainingMatchAmount = input(0);
  readonly active = input(false);

  readonly assigned = output<void>();

  private readonly createDraftReady = signal(false);
  readonly matchedAmount = signal('');
  private readonly submitted = signal(false);

  readonly draftReady = this.createDraftReady.asReadonly();

  readonly matchedAmountError = computed(() => {
    if (!this.submitted()) return null;

    const parsed = parseMatchedAmount(this.matchedAmount());
    if (parsed === null) {
      return 'Matched amount must be a positive number.';
    }

    const remaining = this.remainingMatchAmount();
    if (remaining <= 0) {
      return 'This bank transaction is already fully matched.';
    }

    if (parsed > remaining) {
      return `Matched amount cannot exceed ${formatAmount(remaining)}.`;
    }

    return null;
  });

  readonly isBusy = computed(() => this.journalForm()?.isBusy() ?? false);

  constructor() {
    effect(() => {
      if (!this.dialogOpen()) return;

      untracked(() => {
        this.reset();
      });
    });

    effect(() => {
      if (!this.active() || !this.assignmentsLoaded()) return;

      const txn = this.bankTxn();
      const remaining = this.remainingMatchAmount();
      if (!txn || this.createDraftReady() || remaining <= 0) return;

      untracked(() => {
        void this.ensureCreateDraft(txn, remaining);
      });
    });

    effect(() => {
      if (!this.active() || !this.assignmentsLoaded()) return;

      const remaining = this.remainingMatchAmount();
      untracked(() => {
        this.matchedAmount.set(remaining > 0 ? formatAmountForInput(remaining) : '');
        this.submitted.set(false);
      });
    });
  }

  reset(): void {
    this.createDraftReady.set(false);
    this.matchedAmount.set('');
    this.submitted.set(false);
  }

  async create(): Promise<void> {
    if (
      !this.permissions.can(PERMISSION.fiscalYear.journal.create) ||
      !this.permissions.can(PERMISSION.fiscalYear.bankTxnReconciliation.create)
    ) return;
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

  private async ensureCreateDraft(txn: BankTxn, bankLedgerAmount: number): Promise<void> {
    await this.journalDraftStaging.stageFromBankTxn(txn, { bankLedgerAmount });
    this.createDraftReady.set(true);
  }
}
