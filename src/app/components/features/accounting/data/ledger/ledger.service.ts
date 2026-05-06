import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  Ledger,
  LedgerGetQuery,
  LedgerListQuery,
  LedgerPayload,
} from './ledger.model';

const ENDPOINT = '/accounting/ledger';

@Injectable({ providedIn: 'root' })
export class LedgerService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: LedgerPayload): Promise<Ledger> {
    return this.crudApi.create<Ledger, LedgerPayload>(ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(ENDPOINT, id);
  }

  async getById(id: string, query?: LedgerGetQuery): Promise<Ledger> {
    return this.crudApi.getById<Ledger>(ENDPOINT, id, query);
  }

  async list(query: LedgerListQuery = {}): Promise<readonly Ledger[]> {
    return this.crudApi.list<Ledger>(ENDPOINT, query);
  }

  async count(query: LedgerListQuery = {}): Promise<number> {
    return this.crudApi.count(ENDPOINT, query);
  }

  async update(id: string, payload: LedgerPayload): Promise<Ledger> {
    return this.crudApi.update<Ledger, LedgerPayload>(ENDPOINT, id, payload);
  }
}
