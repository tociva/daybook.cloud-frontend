import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  Customer,
  CustomerGetQuery,
  CustomerListQuery,
  CustomerPayload,
} from './customer.model';

const CUSTOMER_ENDPOINT = '/inventory/customer';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: CustomerPayload): Promise<Customer> {
    return this.crudApi.create<Customer, CustomerPayload>(CUSTOMER_ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(CUSTOMER_ENDPOINT, id);
  }

  async getById(id: string, query?: CustomerGetQuery): Promise<Customer> {
    return this.crudApi.getById<Customer>(CUSTOMER_ENDPOINT, id, query);
  }

  async list(query: CustomerListQuery = {}): Promise<readonly Customer[]> {
    return this.crudApi.list<Customer>(CUSTOMER_ENDPOINT, query);
  }

  async count(query: CustomerListQuery = {}): Promise<number> {
    return this.crudApi.count(CUSTOMER_ENDPOINT, query);
  }

  async update(id: string, payload: CustomerPayload): Promise<Customer> {
    return this.crudApi.update<Customer, CustomerPayload>(CUSTOMER_ENDPOINT, id, payload);
  }
}
