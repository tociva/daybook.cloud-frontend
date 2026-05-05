import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type { Item, ItemGetQuery, ItemListQuery, ItemPayload } from './item.model';

const ITEM_ENDPOINT = '/inventory/item';

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: ItemPayload): Promise<Item> {
    return this.crudApi.create<Item, ItemPayload>(ITEM_ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(ITEM_ENDPOINT, id);
  }

  async getById(id: string, query?: ItemGetQuery): Promise<Item> {
    return this.crudApi.getById<Item>(ITEM_ENDPOINT, id, query);
  }

  async list(query: ItemListQuery = {}): Promise<readonly Item[]> {
    return this.crudApi.list<Item>(ITEM_ENDPOINT, query);
  }

  async count(query: ItemListQuery = {}): Promise<number> {
    return this.crudApi.count(ITEM_ENDPOINT, query);
  }

  async update(id: string, payload: ItemPayload): Promise<Item> {
    return this.crudApi.update<Item, ItemPayload>(ITEM_ENDPOINT, id, payload);
  }
}
