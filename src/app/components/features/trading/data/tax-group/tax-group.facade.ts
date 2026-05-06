import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { TaxGroup, TaxGroupPayload } from './tax-group.model';
import { TaxGroupStore } from './tax-group.store';

@Injectable({ providedIn: 'root' })
export class TaxGroupFacade extends CrudFacadeBase<TaxGroup, TaxGroupPayload> {
  private readonly store = inject(TaxGroupStore);

  protected readonly messages: CudMessages = {
    created: 'Tax group created.',
    updated: 'Tax group updated.',
    deleted: 'Tax group deleted.',
  };

  protected doCreate(payload: TaxGroupPayload): Promise<TaxGroup | null> {
    return this.store.createTaxGroup(payload);
  }

  protected doUpdate(id: string, payload: TaxGroupPayload): Promise<boolean> {
    return this.store.updateTaxGroup(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteTaxGroup(id);
  }
}
