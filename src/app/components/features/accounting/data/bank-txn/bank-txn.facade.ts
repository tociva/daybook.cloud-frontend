import { Injectable, inject } from '@angular/core';
import { ToastStore } from '../../../../../core/toast/toast.store';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { Journal } from '../journal';
import type { BankTxn, BankTxnJournalCreatePayload, BankTxnPayload } from './bank-txn.model';
import { BankTxnStore } from './bank-txn.store';

@Injectable({ providedIn: 'root' })
export class BankTxnFacade extends CrudFacadeBase<BankTxn, BankTxnPayload> {
  private readonly store = inject(BankTxnStore);
  private readonly toastStore = inject(ToastStore);

  protected readonly messages: CudMessages = {
    created: 'Bank transaction created.',
    updated: 'Bank transaction updated.',
    deleted: 'Bank transaction deleted.',
  };

  protected doCreate(payload: BankTxnPayload): Promise<BankTxn | null> {
    return this.store.createBankTxn(payload);
  }

  protected doUpdate(id: string, payload: BankTxnPayload): Promise<boolean> {
    return this.store.updateBankTxn(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteBankTxn(id);
  }

  async createJournalForBankTxn(
    bankTxnId: string,
    payload: BankTxnJournalCreatePayload,
  ): Promise<Journal | null> {
    const result = await this.store.createBankTxnJournal(bankTxnId, payload);
    if (result) {
      this.toastStore.success('Journal created.');
    }
    return result;
  }
}
