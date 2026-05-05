import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  SaleInvoice,
  SaleInvoiceGetQuery,
  SaleInvoiceListQuery,
  SaleInvoicePayload,
} from './sale-invoice.model';

const SALE_INVOICE_ENDPOINT = '/inventory/sale-invoice';

@Injectable({ providedIn: 'root' })
export class SaleInvoiceService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: SaleInvoicePayload): Promise<SaleInvoice> {
    return this.crudApi.create<SaleInvoice, SaleInvoicePayload>(SALE_INVOICE_ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(SALE_INVOICE_ENDPOINT, id);
  }

  async getById(id: string, query?: SaleInvoiceGetQuery): Promise<SaleInvoice> {
    return this.crudApi.getById<SaleInvoice>(SALE_INVOICE_ENDPOINT, id, query);
  }

  async list(query: SaleInvoiceListQuery = {}): Promise<readonly SaleInvoice[]> {
    return this.crudApi.list<SaleInvoice>(SALE_INVOICE_ENDPOINT, query);
  }

  async count(query: SaleInvoiceListQuery = {}): Promise<number> {
    return this.crudApi.count(SALE_INVOICE_ENDPOINT, query);
  }

  async update(id: string, payload: SaleInvoicePayload): Promise<SaleInvoice> {
    return this.crudApi.update<SaleInvoice, SaleInvoicePayload>(SALE_INVOICE_ENDPOINT, id, payload);
  }
}
