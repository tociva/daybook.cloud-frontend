import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { Item, ItemPayload } from './item.model';
import { ItemStore } from './item.store';

@Injectable({ providedIn: 'root' })
export class ItemFacade extends CrudFacadeBase<Item, ItemPayload> {
  private readonly store = inject(ItemStore);

  protected readonly messages: CudMessages = {
    created: 'Item created.',
    updated: 'Item updated.',
    deleted: 'Item deleted.',
  };

  protected doCreate(payload: ItemPayload): Promise<Item | null> {
    return this.store.createItem(payload);
  }

  protected doUpdate(id: string, payload: ItemPayload): Promise<boolean> {
    return this.store.updateItem(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteItem(id);
  }
}
