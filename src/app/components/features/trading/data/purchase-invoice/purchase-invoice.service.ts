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
    const invoice = await this.crudApi.create<PurchaseInvoice, PurchaseInvoicePayload>(
      PURCHASE_INVOICE_ENDPOINT,
      payload,
    );
    return this.normalizeInvoiceDates(invoice);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(PURCHASE_INVOICE_ENDPOINT, id);
  }

  async getById(id: string, query?: PurchaseInvoiceGetQuery): Promise<PurchaseInvoice> {
    const invoice = await this.crudApi.getById<PurchaseInvoice>(
      PURCHASE_INVOICE_ENDPOINT,
      id,
      query,
    );
    return this.normalizeInvoiceDates(invoice);
  }

  async list(query: PurchaseInvoiceListQuery = {}): Promise<readonly PurchaseInvoice[]> {
    const invoices = await this.crudApi.list<PurchaseInvoice>(PURCHASE_INVOICE_ENDPOINT, query);
    return invoices.map((invoice) => this.normalizeInvoiceDates(invoice));
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

  private normalizeInvoiceDates(invoice: PurchaseInvoice): PurchaseInvoice {
    return {
      ...invoice,
      date: this.toDateOnly(invoice.date),
      duedate: invoice.duedate ? this.toDateOnly(invoice.duedate) : invoice.duedate,
    };
  }

  private toDateOnly(value: string | Date): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    const normalized = value.trim();
    const dateOnlyMatch = normalized.match(/^\d{4}-\d{2}-\d{2}/);
    return dateOnlyMatch?.[0] ?? normalized;
  }
}
