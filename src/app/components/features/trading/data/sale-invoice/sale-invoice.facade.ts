import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { SaleInvoice, SaleInvoicePayload } from './sale-invoice.model';
import { SaleInvoiceStore } from './sale-invoice.store';

@Injectable({ providedIn: 'root' })
export class SaleInvoiceFacade extends CrudFacadeBase<SaleInvoice, SaleInvoicePayload> {
  private readonly store = inject(SaleInvoiceStore);

  protected readonly messages: CudMessages = {
    created: 'Sale invoice created.',
    updated: 'Sale invoice updated.',
    deleted: 'Sale invoice deleted.',
  };

  protected doCreate(payload: SaleInvoicePayload): Promise<SaleInvoice | null> {
    return this.store.createSaleInvoice(payload);
  }

  protected doUpdate(id: string, payload: SaleInvoicePayload): Promise<boolean> {
    return this.store.updateSaleInvoice(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteSaleInvoice(id);
  }
}
