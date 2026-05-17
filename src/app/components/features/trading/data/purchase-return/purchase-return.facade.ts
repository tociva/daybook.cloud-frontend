import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { PurchaseReturn, PurchaseReturnPayload } from './purchase-return.model';
import { PurchaseReturnStore } from './purchase-return.store';

@Injectable({ providedIn: 'root' })
export class PurchaseReturnFacade extends CrudFacadeBase<PurchaseReturn, PurchaseReturnPayload> {
  private readonly store = inject(PurchaseReturnStore);

  protected readonly messages: CudMessages = {
    created: 'Purchase return created.',
    updated: 'Purchase return updated.',
    deleted: 'Purchase return deleted.',
  };

  protected doCreate(payload: PurchaseReturnPayload): Promise<PurchaseReturn | null> {
    return this.store.createPurchaseReturn(payload);
  }

  protected doUpdate(id: string, payload: PurchaseReturnPayload): Promise<boolean> {
    return this.store.updatePurchaseReturn(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deletePurchaseReturn(id);
  }
}
