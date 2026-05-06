import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { Ledger, LedgerPayload } from './ledger.model';
import { LedgerStore } from './ledger.store';

@Injectable({ providedIn: 'root' })
export class LedgerFacade extends CrudFacadeBase<Ledger, LedgerPayload> {
  private readonly store = inject(LedgerStore);

  protected readonly messages: CudMessages = {
    created: 'Ledger created.',
    updated: 'Ledger updated.',
    deleted: 'Ledger deleted.',
  };

  protected doCreate(payload: LedgerPayload): Promise<Ledger | null> {
    return this.store.createLedger(payload);
  }

  protected doUpdate(id: string, payload: LedgerPayload): Promise<boolean> {
    return this.store.updateLedger(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteLedger(id);
  }
}
