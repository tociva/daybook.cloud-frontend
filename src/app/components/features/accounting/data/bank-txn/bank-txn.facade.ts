import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { BankTxn, BankTxnPayload } from './bank-txn.model';
import { BankTxnStore } from './bank-txn.store';

@Injectable({ providedIn: 'root' })
export class BankTxnFacade extends CrudFacadeBase<BankTxn, BankTxnPayload> {
  private readonly store = inject(BankTxnStore);

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
}
