import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { Customer, CustomerPayload } from './customer.model';
import { CustomerStore } from './customer.store';

@Injectable({ providedIn: 'root' })
export class CustomerFacade extends CrudFacadeBase<Customer, CustomerPayload> {
  private readonly store = inject(CustomerStore);

  protected readonly messages: CudMessages = {
    created: 'Customer created.',
    updated: 'Customer updated.',
    deleted: 'Customer deleted.',
  };

  protected doCreate(payload: CustomerPayload): Promise<Customer | null> {
    return this.store.createCustomer(payload);
  }

  protected doUpdate(id: string, payload: CustomerPayload): Promise<boolean> {
    return this.store.updateCustomer(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteCustomer(id);
  }
}
