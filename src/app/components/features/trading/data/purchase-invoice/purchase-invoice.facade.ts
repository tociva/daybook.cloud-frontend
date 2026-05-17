import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { PurchaseInvoice, PurchaseInvoicePayload } from './purchase-invoice.model';
import { PurchaseInvoiceStore } from './purchase-invoice.store';

@Injectable({ providedIn: 'root' })
export class PurchaseInvoiceFacade extends CrudFacadeBase<PurchaseInvoice, PurchaseInvoicePayload> {
  private readonly store = inject(PurchaseInvoiceStore);

  protected readonly messages: CudMessages = {
    created: 'Purchase invoice created.',
    updated: 'Purchase invoice updated.',
    deleted: 'Purchase invoice deleted.',
  };

  protected doCreate(payload: PurchaseInvoicePayload): Promise<PurchaseInvoice | null> {
    return this.store.createPurchaseInvoice(payload);
  }

  protected doUpdate(id: string, payload: PurchaseInvoicePayload): Promise<boolean> {
    return this.store.updatePurchaseInvoice(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deletePurchaseInvoice(id);
  }
}
