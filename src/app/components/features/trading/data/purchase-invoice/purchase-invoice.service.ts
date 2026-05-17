import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  PurchaseInvoice,
  PurchaseInvoiceGetQuery,
  PurchaseInvoiceListQuery,
  PurchaseInvoicePayload,
} from './purchase-invoice.model';

const PURCHASE_INVOICE_ENDPOINT = '/inventory/purchase-invoice';

@Injectable({ providedIn: 'root' })
export class PurchaseInvoiceService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: PurchaseInvoicePayload): Promise<PurchaseInvoice> {
    return this.crudApi.create<PurchaseInvoice, PurchaseInvoicePayload>(
      PURCHASE_INVOICE_ENDPOINT,
      payload,
    );
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(PURCHASE_INVOICE_ENDPOINT, id);
  }

  async getById(id: string, query?: PurchaseInvoiceGetQuery): Promise<PurchaseInvoice> {
    return this.crudApi.getById<PurchaseInvoice>(PURCHASE_INVOICE_ENDPOINT, id, query);
  }

  async list(query: PurchaseInvoiceListQuery = {}): Promise<readonly PurchaseInvoice[]> {
    return this.crudApi.list<PurchaseInvoice>(PURCHASE_INVOICE_ENDPOINT, query);
  }

  async count(query: PurchaseInvoiceListQuery = {}): Promise<number> {
    return this.crudApi.count(PURCHASE_INVOICE_ENDPOINT, query);
  }

  async update(id: string, payload: PurchaseInvoicePayload): Promise<PurchaseInvoice> {
    return this.crudApi.update<PurchaseInvoice, PurchaseInvoicePayload>(
      PURCHASE_INVOICE_ENDPOINT,
      id,
      payload,
    );
  }
}
