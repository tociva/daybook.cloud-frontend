import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  ContraTransaction,
  ContraTransactionGetQuery,
  ContraTransactionListQuery,
  ContraTransactionPayload,
} from './contra-transaction.model';

const CONTRA_TRANSACTION_ENDPOINT = '/inventory/contra-transaction';

@Injectable({ providedIn: 'root' })
export class ContraTransactionService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: ContraTransactionPayload): Promise<ContraTransaction> {
    return this.crudApi.create<ContraTransaction, ContraTransactionPayload>(
      CONTRA_TRANSACTION_ENDPOINT,
      payload,
    );
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(CONTRA_TRANSACTION_ENDPOINT, id);
  }

  async getById(id: string, query?: ContraTransactionGetQuery): Promise<ContraTransaction> {
    return this.crudApi.getById<ContraTransaction>(CONTRA_TRANSACTION_ENDPOINT, id, query);
  }

  async list(query: ContraTransactionListQuery = {}): Promise<readonly ContraTransaction[]> {
    return this.crudApi.list<ContraTransaction>(CONTRA_TRANSACTION_ENDPOINT, query);
  }

  async count(query: ContraTransactionListQuery = {}): Promise<number> {
    return this.crudApi.count(CONTRA_TRANSACTION_ENDPOINT, query);
  }

  async update(id: string, payload: ContraTransactionPayload): Promise<void> {
    await this.crudApi.update<void, ContraTransactionPayload>(
      CONTRA_TRANSACTION_ENDPOINT,
      id,
      payload,
    );
  }
}
