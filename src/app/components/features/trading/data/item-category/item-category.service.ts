import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  ItemCategory,
  ItemCategoryGetQuery,
  ItemCategoryListQuery,
  ItemCategoryPayload,
} from './item-category.model';

const ITEM_CATEGORY_ENDPOINT = '/inventory/item-category';

@Injectable({ providedIn: 'root' })
export class ItemCategoryService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: ItemCategoryPayload): Promise<ItemCategory> {
    return this.crudApi.create<ItemCategory, ItemCategoryPayload>(ITEM_CATEGORY_ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(ITEM_CATEGORY_ENDPOINT, id);
  }

  async getById(id: string, query?: ItemCategoryGetQuery): Promise<ItemCategory> {
    return this.crudApi.getById<ItemCategory>(ITEM_CATEGORY_ENDPOINT, id, query);
  }

  async list(query: ItemCategoryListQuery = {}): Promise<readonly ItemCategory[]> {
    return this.crudApi.list<ItemCategory>(ITEM_CATEGORY_ENDPOINT, query);
  }

  async count(query: ItemCategoryListQuery = {}): Promise<number> {
    return this.crudApi.count(ITEM_CATEGORY_ENDPOINT, query);
  }

  async update(id: string, payload: ItemCategoryPayload): Promise<ItemCategory> {
    return this.crudApi.update<ItemCategory, ItemCategoryPayload>(
      ITEM_CATEGORY_ENDPOINT,
      id,
      payload,
    );
  }
}
