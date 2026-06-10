import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  Journal,
  JournalCreatePayload,
  JournalGetQuery,
  JournalListQuery,
  JournalUpdatePayload,
} from './journal.model';

const ENDPOINT = '/accounting/journal';

@Injectable({ providedIn: 'root' })
export class JournalService {
  private readonly crudApi = inject(CrudApiService);
  private readonly http = inject(HttpClient);
  private readonly appConfigStore = inject(AppConfigStore);

  async create(payload: JournalCreatePayload): Promise<Journal> {
    return this.crudApi.create<Journal, JournalCreatePayload>(ENDPOINT, payload);
  }

  async createMany(payloads: readonly JournalCreatePayload[]): Promise<readonly Journal[]> {
    const url = `${await this.collectionUrl()}/many`;
    return firstValueFrom(this.http.post<Journal[]>(url, payloads));
  }

  async createFromSaleInvoice(saleInvoiceId: string): Promise<Journal> {
    const url = `${await this.collectionUrl()}/sale-invoices/${saleInvoiceId}`;
    return firstValueFrom(this.http.post<Journal>(url, null));
  }

  async createFromSaleInvoices(saleinvoiceids: readonly string[]): Promise<readonly Journal[]> {
    const url = `${await this.collectionUrl()}/sale-invoices`;
    return firstValueFrom(this.http.post<Journal[]>(url, { saleinvoiceids }));
  }

  async createFromPurchaseInvoice(purchaseInvoiceId: string): Promise<Journal> {
    const journals = await this.createFromPurchaseInvoices([purchaseInvoiceId]);
    const journal = journals[0];
    if (!journal) {
      throw new Error('No journal returned.');
    }
    return journal;
  }

  async createFromPurchaseInvoices(
    purchaseinvoiceids: readonly string[],
  ): Promise<readonly Journal[]> {
    const url = `${await this.collectionUrl()}/purchase-invoices`;
    return firstValueFrom(this.http.post<Journal[]>(url, { purchaseinvoiceids }));
  }

  async createFromCustomerReceipt(customerReceiptId: string): Promise<Journal> {
    const journals = await this.createFromCustomerReceipts([customerReceiptId]);
    const journal = journals[0];
    if (!journal) {
      throw new Error('No journal returned.');
    }
    return journal;
  }

  async createFromCustomerReceipts(
    customerreceiptids: readonly string[],
  ): Promise<readonly Journal[]> {
    const url = `${await this.collectionUrl()}/customer-receipts`;
    return firstValueFrom(this.http.post<Journal[]>(url, { customerreceiptids }));
  }

  async createFromVendorPayments(vendorpaymentids: readonly string[]): Promise<readonly Journal[]> {
    const url = `${await this.collectionUrl()}/vendor-payments`;
    return firstValueFrom(this.http.post<Journal[]>(url, { vendorpaymentids }));
  }

  /** Backend returns 204 No Content. */
  async delete(id: string): Promise<void> {
    const url = `${await this.collectionUrl()}/${id}`;
    const res = await firstValueFrom(
      this.http.delete(url, { observe: 'response', responseType: 'text' }),
    );
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Unexpected response status ${res.status}.`);
    }
  }

  async getById(id: string, query?: JournalGetQuery): Promise<Journal> {
    return this.crudApi.getById<Journal>(ENDPOINT, id, query);
  }

  async list(query: JournalListQuery = {}): Promise<readonly Journal[]> {
    return this.crudApi.list<Journal>(ENDPOINT, query);
  }

  async count(query: JournalListQuery = {}): Promise<number> {
    return this.crudApi.count(ENDPOINT, query);
  }

  /** Backend returns 204 No Content. */
  async update(id: string, payload: JournalUpdatePayload): Promise<void> {
    const url = `${await this.collectionUrl()}/${id}`;
    const res = await firstValueFrom(
      this.http.patch(url, payload, { observe: 'response', responseType: 'text' }),
    );
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Unexpected response status ${res.status}.`);
    }
  }

  private async collectionUrl(): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    return `${config.apiBaseUrl.replace(/\/$/, '')}/${ENDPOINT.replace(/^\/+/, '')}`;
  }
}
