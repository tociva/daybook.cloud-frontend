import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { CustomerReceipt, CustomerReceiptPayload } from './customer-receipt.model';
import { CustomerReceiptStore } from './customer-receipt.store';

@Injectable({ providedIn: 'root' })
export class CustomerReceiptFacade extends CrudFacadeBase<CustomerReceipt, CustomerReceiptPayload> {
  private readonly store = inject(CustomerReceiptStore);

  protected readonly messages: CudMessages = {
    created: 'Customer receipt created.',
    updated: 'Customer receipt updated.',
    deleted: 'Customer receipt deleted.',
  };

  protected doCreate(payload: CustomerReceiptPayload): Promise<CustomerReceipt | null> {
    return this.store.createCustomerReceipt(payload);
  }

  protected doUpdate(id: string, payload: CustomerReceiptPayload): Promise<boolean> {
    return this.store.updateCustomerReceipt(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteCustomerReceipt(id);
  }
}
