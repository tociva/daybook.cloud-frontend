import { Injectable, inject, signal } from '@angular/core';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../core/toast/toast.store';
import { JournalSourceType } from '../journal';
import type {
  ReconciliationMatch,
  ReconciliationMatchLinkAssignment,
  ReconciliationMatchLinkPayload,
} from './reconciliation-match.model';
import { ReconciliationMatchService } from './reconciliation-match.service';

const UNLINKABLE_SOURCE_TYPES = new Set<JournalSourceType>([
  JournalSourceType.BANK_TXN,
  JournalSourceType.SALE_INVOICE,
  JournalSourceType.PURCHASE_INVOICE,
  JournalSourceType.RECEIPT,
  JournalSourceType.PAYMENT,
]);

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
    return this.executeUnlink(JournalSourceType.BANK_TXN, bankTxnId, journalId);
  }

  async unlinkJournalFromSource(
    sourcetype: JournalSourceType,
    sourceId: string,
    journalId: string,
  ): Promise<boolean> {
    if (!UNLINKABLE_SOURCE_TYPES.has(sourcetype)) {
      this._error.set('This journal cannot be unlinked from its source.');
      return false;
    }

    return this.executeUnlink(sourcetype, sourceId, journalId);
  }

  private async executeUnlink(
    sourcetype: JournalSourceType,
    sourceId: string,
    journalId: string,
  ): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      await this.service.unlinkJournalFromSource(sourcetype, sourceId, journalId);
      const message =
        sourcetype === JournalSourceType.BANK_TXN ? 'Journal unassigned.' : 'Source unlinked.';
      this.toastStore.success(message);
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'Failed to unlink source.'));
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }
}
