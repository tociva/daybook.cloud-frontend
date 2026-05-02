import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type { BankCash, BankCashListQuery, BankCashPayload } from './bank-cash.model';

const BANK_CASH_ENDPOINT = '/inventory/bank-cash';

@Injectable({ providedIn: 'root' })
export class BankCashService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: BankCashPayload): Promise<BankCash> {
    return this.crudApi.create<BankCash, BankCashPayload>(BANK_CASH_ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(BANK_CASH_ENDPOINT, id);
  }

  async getById(id: string): Promise<BankCash> {
    return this.crudApi.getById<BankCash>(BANK_CASH_ENDPOINT, id);
  }

  async list(query: BankCashListQuery = {}): Promise<readonly BankCash[]> {
    return this.crudApi.list<BankCash>(BANK_CASH_ENDPOINT, query);
  }

  async count(query: BankCashListQuery = {}): Promise<number> {
    return this.crudApi.count(BANK_CASH_ENDPOINT, query);
  }

  async update(id: string, payload: BankCashPayload): Promise<BankCash> {
    return this.crudApi.update<BankCash, BankCashPayload>(BANK_CASH_ENDPOINT, id, payload);
  }
}
