import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type { TaxGroup, TaxGroupListQuery, TaxGroupPayload } from './tax-group.model';

const TAX_GROUP_ENDPOINT = '/inventory/tax-group';

@Injectable({ providedIn: 'root' })
export class TaxGroupService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: TaxGroupPayload): Promise<TaxGroup> {
    return this.crudApi.create<TaxGroup, TaxGroupPayload>(TAX_GROUP_ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(TAX_GROUP_ENDPOINT, id);
  }

  async getById(id: string): Promise<TaxGroup> {
    return this.crudApi.getById<TaxGroup>(TAX_GROUP_ENDPOINT, id);
  }

  async list(query: TaxGroupListQuery = {}): Promise<readonly TaxGroup[]> {
    return this.crudApi.list<TaxGroup>(TAX_GROUP_ENDPOINT, query);
  }

  async count(query: TaxGroupListQuery = {}): Promise<number> {
    return this.crudApi.count(TAX_GROUP_ENDPOINT, query);
  }

  async update(id: string, payload: TaxGroupPayload): Promise<TaxGroup> {
    return this.crudApi.update<TaxGroup, TaxGroupPayload>(TAX_GROUP_ENDPOINT, id, payload);
  }
}

