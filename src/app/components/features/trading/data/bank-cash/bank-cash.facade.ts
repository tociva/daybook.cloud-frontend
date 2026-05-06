import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import { BankCashStore } from './bank-cash.store';
import type { BankCash, BankCashPayload } from './bank-cash.model';

@Injectable({ providedIn: 'root' })
export class BankCashFacade extends CrudFacadeBase<BankCash, BankCashPayload> {
  private readonly store = inject(BankCashStore);

  protected readonly messages: CudMessages = {
    created: 'Bank/Cash account created.',
    updated: 'Bank/Cash account updated.',
    deleted: 'Bank/Cash account deleted.',
  };

  protected doCreate(payload: BankCashPayload): Promise<BankCash | null> {
    return this.store.createBankCash(payload);
  }

  protected doUpdate(id: string, payload: BankCashPayload): Promise<boolean> {
    return this.store.updateBankCash(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteBankCash(id);
  }
}
