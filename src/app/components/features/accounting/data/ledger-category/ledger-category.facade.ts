import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { LedgerCategory, LedgerCategoryPayload } from './ledger-category.model';
import { LedgerCategoryStore } from './ledger-category.store';

@Injectable({ providedIn: 'root' })
export class LedgerCategoryFacade extends CrudFacadeBase<LedgerCategory, LedgerCategoryPayload> {
  private readonly store = inject(LedgerCategoryStore);

  protected readonly messages: CudMessages = {
    created: 'Ledger category created.',
    updated: 'Ledger category updated.',
    deleted: 'Ledger category deleted.',
  };

  protected doCreate(payload: LedgerCategoryPayload): Promise<LedgerCategory | null> {
    return this.store.createLedgerCategory(payload);
  }

  protected doUpdate(id: string, payload: LedgerCategoryPayload): Promise<boolean> {
    return this.store.updateLedgerCategory(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteLedgerCategory(id);
  }
}
