import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { ContraTransaction, ContraTransactionPayload } from './contra-transaction.model';
import { ContraTransactionStore } from './contra-transaction.store';

@Injectable({ providedIn: 'root' })
export class ContraTransactionFacade extends CrudFacadeBase<
  ContraTransaction,
  ContraTransactionPayload
> {
  private readonly store = inject(ContraTransactionStore);

  protected readonly messages: CudMessages = {
    created: 'Bank contra transaction created.',
    updated: 'Bank contra transaction updated.',
    deleted: 'Bank contra transaction deleted.',
  };

  protected doCreate(payload: ContraTransactionPayload): Promise<ContraTransaction | null> {
    return this.store.createContraTransaction(payload);
  }

  protected doUpdate(id: string, payload: ContraTransactionPayload): Promise<boolean> {
    return this.store.updateContraTransaction(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteContraTransaction(id);
  }
}
