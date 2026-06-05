import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  InventoryLedgerMap,
  InventoryLedgerMapGetQuery,
  InventoryLedgerMapListQuery,
  InventoryLedgerMapPayload,
} from './inventory-ledger-map.model';

const ENDPOINT = '/accounting/inventory-ledger-map';

@Injectable({ providedIn: 'root' })
export class InventoryLedgerMapService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: InventoryLedgerMapPayload): Promise<InventoryLedgerMap> {
    return this.crudApi.create<InventoryLedgerMap, InventoryLedgerMapPayload>(ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(ENDPOINT, id);
  }

  async getById(id: string, query?: InventoryLedgerMapGetQuery): Promise<InventoryLedgerMap> {
    return this.crudApi.getById<InventoryLedgerMap>(ENDPOINT, id, query);
  }

  async list(query: InventoryLedgerMapListQuery = {}): Promise<readonly InventoryLedgerMap[]> {
    return this.crudApi.list<InventoryLedgerMap>(ENDPOINT, query);
  }

  async count(query: InventoryLedgerMapListQuery = {}): Promise<number> {
    return this.crudApi.count(ENDPOINT, query);
  }

  async update(id: string, payload: InventoryLedgerMapPayload): Promise<InventoryLedgerMap> {
    return this.crudApi.update<InventoryLedgerMap, InventoryLedgerMapPayload>(
      ENDPOINT,
      id,
      payload,
    );
  }
}

