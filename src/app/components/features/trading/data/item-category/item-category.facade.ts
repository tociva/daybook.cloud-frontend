import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { ItemCategory, ItemCategoryPayload } from './item-category.model';
import { ItemCategoryStore } from './item-category.store';

@Injectable({ providedIn: 'root' })
export class ItemCategoryFacade extends CrudFacadeBase<ItemCategory, ItemCategoryPayload> {
  private readonly store = inject(ItemCategoryStore);

  protected readonly messages: CudMessages = {
    created: 'Item category created.',
    updated: 'Item category updated.',
    deleted: 'Item category deleted.',
  };

  protected doCreate(payload: ItemCategoryPayload): Promise<ItemCategory | null> {
    return this.store.createItemCategory(payload);
  }

  protected doUpdate(id: string, payload: ItemCategoryPayload): Promise<boolean> {
    return this.store.updateItemCategory(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteItemCategory(id);
  }
}
