import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { Tax, TaxPayload } from './tax.model';
import { TaxStore } from './tax.store';

@Injectable({ providedIn: 'root' })
export class TaxFacade extends CrudFacadeBase<Tax, TaxPayload> {
  private readonly store = inject(TaxStore);

  protected readonly messages: CudMessages = {
    created: 'Tax created.',
    updated: 'Tax updated.',
    deleted: 'Tax deleted.',
  };

  protected doCreate(payload: TaxPayload): Promise<Tax | null> {
    return this.store.createTax(payload);
  }

  protected doUpdate(id: string, payload: TaxPayload): Promise<boolean> {
    return this.store.updateTax(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteTax(id);
  }
}
