import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  PurchaseReturn,
  PurchaseReturnGetQuery,
  PurchaseReturnListQuery,
  PurchaseReturnPayload,
} from './purchase-return.model';

const PURCHASE_RETURN_ENDPOINT = '/inventory/purchase-return';

@Injectable({ providedIn: 'root' })
export class PurchaseReturnService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: PurchaseReturnPayload): Promise<PurchaseReturn> {
    return this.crudApi.create<PurchaseReturn, PurchaseReturnPayload>(
      PURCHASE_RETURN_ENDPOINT,
      payload,
    );
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(PURCHASE_RETURN_ENDPOINT, id);
  }

  async getById(id: string, query?: PurchaseReturnGetQuery): Promise<PurchaseReturn> {
    return this.crudApi.getById<PurchaseReturn>(PURCHASE_RETURN_ENDPOINT, id, query);
  }

  async list(query: PurchaseReturnListQuery = {}): Promise<readonly PurchaseReturn[]> {
    return this.crudApi.list<PurchaseReturn>(PURCHASE_RETURN_ENDPOINT, query);
  }

  async count(query: PurchaseReturnListQuery = {}): Promise<number> {
    return this.crudApi.count(PURCHASE_RETURN_ENDPOINT, query);
  }

  async update(id: string, payload: PurchaseReturnPayload): Promise<PurchaseReturn> {
    return this.crudApi.update<PurchaseReturn, PurchaseReturnPayload>(
      PURCHASE_RETURN_ENDPOINT,
      id,
      payload,
    );
  }
}
