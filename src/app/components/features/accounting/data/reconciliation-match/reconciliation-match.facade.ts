import { Injectable, inject, signal } from '@angular/core';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../core/toast/toast.store';
import type {
  ReconciliationMatch,
  ReconciliationMatchLinkAssignment,
  ReconciliationMatchLinkPayload,
} from './reconciliation-match.model';
import { ReconciliationMatchService } from './reconciliation-match.service';

@Injectable({ providedIn: 'root' })
export class ReconciliationMatchFacade {
  private readonly service = inject(ReconciliationMatchService);
  private readonly toastStore = inject(ToastStore);

  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  clearError(): void {
    this._error.set(null);
  }

  async linkJournalToBankTxn(
    bankTxnId: string,
    journalId: string,
    payload: ReconciliationMatchLinkPayload,
  ): Promise<ReconciliationMatch | null> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const result = await this.service.linkToBankTxn(bankTxnId, journalId, payload);
      this.toastStore.success('Journal assigned.');
      return result;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'Failed to assign journal.'));
      return null;
    } finally {
      this._isLoading.set(false);
    }
  }

  async linkJournalsToBankTxn(
    bankTxnId: string,
    assignments: readonly ReconciliationMatchLinkAssignment[],
  ): Promise<boolean> {
    if (!assignments.length) return false;

    this._isLoading.set(true);
    this._error.set(null);
    try {
      for (const assignment of assignments) {
        await this.service.linkToBankTxn(bankTxnId, assignment.journalId, {
          matchedamount: assignment.matchedamount,
          ...(assignment.matchprops ? { matchprops: assignment.matchprops } : {}),
        });
      }
      const count = assignments.length;
      this.toastStore.success(
        count === 1 ? 'Journal assigned.' : `${count} journals assigned.`,
      );
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'Failed to assign journals.'));
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  async unlinkJournalFromBankTxn(bankTxnId: string, journalId: string): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      await this.service.unlinkFromBankTxn(bankTxnId, journalId);
      this.toastStore.success('Journal unassigned.');
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'Failed to unassign journal.'));
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }
}
