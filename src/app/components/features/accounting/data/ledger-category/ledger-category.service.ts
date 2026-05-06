import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  LedgerCategory,
  LedgerCategoryGetQuery,
  LedgerCategoryListQuery,
  LedgerCategoryPayload,
} from './ledger-category.model';

const ENDPOINT = '/accounting/ledger-category';

@Injectable({ providedIn: 'root' })
export class LedgerCategoryService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: LedgerCategoryPayload): Promise<LedgerCategory> {
    return this.crudApi.create<LedgerCategory, LedgerCategoryPayload>(ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(ENDPOINT, id);
  }

  async getById(id: string, query?: LedgerCategoryGetQuery): Promise<LedgerCategory> {
    return this.crudApi.getById<LedgerCategory>(ENDPOINT, id, query);
  }

  async list(query: LedgerCategoryListQuery = {}): Promise<readonly LedgerCategory[]> {
    return this.crudApi.list<LedgerCategory>(ENDPOINT, query);
  }

  async count(query: LedgerCategoryListQuery = {}): Promise<number> {
    return this.crudApi.count(ENDPOINT, query);
  }

  async update(id: string, payload: LedgerCategoryPayload): Promise<LedgerCategory> {
    return this.crudApi.update<LedgerCategory, LedgerCategoryPayload>(ENDPOINT, id, payload);
  }
}
