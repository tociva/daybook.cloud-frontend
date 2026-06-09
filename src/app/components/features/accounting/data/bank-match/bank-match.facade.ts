import { Injectable, inject, signal } from '@angular/core';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../core/toast/toast.store';
import type { BankMatch, BankMatchCreatePayload } from './bank-match.model';
import { BankMatchService } from './bank-match.service';

@Injectable({ providedIn: 'root' })
export class BankMatchFacade {
  private readonly service = inject(BankMatchService);
  private readonly toastStore = inject(ToastStore);

  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  clearError(): void {
    this._error.set(null);
  }

  async linkJournalToBankTxn(payload: BankMatchCreatePayload): Promise<BankMatch | null> {
    this._isLoading.set(true);
    this._error.set(null);
    try {
      const result = await this.service.create(payload);
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
    payloads: readonly BankMatchCreatePayload[],
  ): Promise<boolean> {
    if (!payloads.length) return false;

    this._isLoading.set(true);
    this._error.set(null);
    try {
      for (const payload of payloads) {
        await this.service.create(payload);
      }
      const count = payloads.length;
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
}
