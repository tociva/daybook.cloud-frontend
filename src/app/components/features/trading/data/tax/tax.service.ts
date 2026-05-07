import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type { Tax, TaxListQuery, TaxPayload } from './tax.model';

const TAX_ENDPOINT = '/inventory/tax';

@Injectable({ providedIn: 'root' })
export class TaxService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: TaxPayload): Promise<Tax> {
    return this.crudApi.create<Tax, TaxPayload>(TAX_ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(TAX_ENDPOINT, id);
  }

  async getById(id: string): Promise<Tax> {
    return this.crudApi.getById<Tax>(TAX_ENDPOINT, id);
  }

  async list(query: TaxListQuery = {}): Promise<readonly Tax[]> {
    return this.crudApi.list<Tax>(TAX_ENDPOINT, query);
  }

  async count(query: TaxListQuery = {}): Promise<number> {
    return this.crudApi.count(TAX_ENDPOINT, query);
  }

  async update(id: string, payload: TaxPayload): Promise<Tax> {
    return this.crudApi.update<Tax, TaxPayload>(TAX_ENDPOINT, id, payload);
  }
}
