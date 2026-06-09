import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  TngButtonComponent,
  TngDialogComponent,
  TngError,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BankTxnFacade, BankTxnStore } from '../../../data/bank-txn';
import type { BankTxn } from '../../../data/bank-txn';
import { JournalCreateFormComponent } from '../../journal/create-journal/journal-create-form/journal-create-form.component';

function parseMatchedAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function sumExistingMatchedAmount(matches: BankTxn['matches']): number {
  if (!matches?.length) return 0;

  return matches.reduce((sum, match) => {
    const amount = Number((match as { matchedamount?: number }).matchedamount ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}

@Component({
  selector: 'app-journal-create-dialog',
  standalone: true,
  imports: [
    JournalCreateFormComponent,
    TngButtonComponent,
    TngDialogComponent,
    TngError,
    TngFormFieldComponent,
    TngInputComponent,
    TngLabelComponent,
    TngIcon,
  ],
  templateUrl: './journal-create-dialog.component.html',
  styleUrl: './journal-create-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalCreateDialogComponent {
  protected readonly dialogWidth = '50%';
  protected readonly dialogHeight = 'calc(100vh - 2rem)';

  private readonly bankTxnFacade = inject(BankTxnFacade);
  protected readonly bankTxnStore = inject(BankTxnStore);

  protected readonly journalForm = viewChild(JournalCreateFormComponent);

  readonly open = input.required<boolean>();
  readonly bankTxn = input<BankTxn | null>(null);

  readonly closed = output<void>();
  readonly created = output<void>();

  protected readonly matchedAmount = signal('');
  protected readonly submitted = signal(false);

  protected readonly isSaving = computed(
    () => this.bankTxnStore.isLoading() || (this.journalForm()?.isBusy() ?? false),
  );

  protected readonly bankTxnMaxAmount = computed(() => {
    const txn = this.bankTxn();
    if (!txn) return 0;
    const debit = Number(txn.debit ?? 0);
    const credit = Number(txn.credit ?? 0);
    return debit > 0 ? debit : credit;
  });

  protected readonly alreadyMatchedAmount = computed(() =>
    sumExistingMatchedAmount(this.bankTxn()?.matches),
  );

  protected readonly remainingMatchAmount = computed(() => {
    const max = this.bankTxnMaxAmount();
    if (max <= 0) return 0;
    return Math.max(0, max - this.alreadyMatchedAmount());
  });

  protected readonly matchedAmountError = computed(() => {
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
      return `Matched amount cannot exceed ${remaining}.`;
    }

    return null;
  });

  constructor() {
    effect(() => {
      if (!this.open() || !this.bankTxn()) return;

      const remaining = this.remainingMatchAmount();
      this.matchedAmount.set(remaining > 0 ? String(remaining) : '');
      this.submitted.set(false);
      this.bankTxnStore.clearError();
    });
  }

  protected onDialogClosed(): void {
    if (this.isSaving()) return;
    this.closed.emit();
  }

  protected onCancelled(): void {
    this.closed.emit();
  }

  protected async onSubmit(): Promise<void> {
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

    this.created.emit();
  }
}
