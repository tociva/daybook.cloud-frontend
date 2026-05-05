import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  CustomerReceipt,
  CustomerReceiptGetQuery,
  CustomerReceiptListQuery,
  CustomerReceiptPayload,
} from './customer-receipt.model';

const CUSTOMER_RECEIPT_ENDPOINT = '/inventory/customer-receipt';

@Injectable({ providedIn: 'root' })
export class CustomerReceiptService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: CustomerReceiptPayload): Promise<CustomerReceipt> {
    return this.crudApi.create<CustomerReceipt, CustomerReceiptPayload>(
      CUSTOMER_RECEIPT_ENDPOINT,
      payload,
    );
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(CUSTOMER_RECEIPT_ENDPOINT, id);
  }

  async getById(id: string, query?: CustomerReceiptGetQuery): Promise<CustomerReceipt> {
    return this.crudApi.getById<CustomerReceipt>(CUSTOMER_RECEIPT_ENDPOINT, id, query);
  }

  async list(query: CustomerReceiptListQuery = {}): Promise<readonly CustomerReceipt[]> {
    return this.crudApi.list<CustomerReceipt>(CUSTOMER_RECEIPT_ENDPOINT, query);
  }

  async count(query: CustomerReceiptListQuery = {}): Promise<number> {
    return this.crudApi.count(CUSTOMER_RECEIPT_ENDPOINT, query);
  }

  async update(id: string, payload: CustomerReceiptPayload): Promise<CustomerReceipt> {
    return this.crudApi.update<CustomerReceipt, CustomerReceiptPayload>(
      CUSTOMER_RECEIPT_ENDPOINT,
      id,
      payload,
    );
  }
}
