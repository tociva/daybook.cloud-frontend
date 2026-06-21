import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import { CrudApiService } from '../../../../../shared/crud';
import { normalizeLb4Filter, toLb4ListRequestFilterBody } from '../../../../../shared/crud/lb4-query';
import type { Journal } from '../journal';
import type {
  BankTxn,
  BankTxnGetQuery,
  BankTxnJournalCreatePayload,
  BankTxnListQuery,
  BankTxnListResponse,
  BankTxnPayload,
} from './bank-txn.model';

const ENDPOINT = '/accounting/bank-txn';

@Injectable({ providedIn: 'root' })
export class BankTxnService {
  private readonly appConfigStore = inject(AppConfigStore);
  private readonly crudApi = inject(CrudApiService);
  private readonly http = inject(HttpClient);

  async create(payload: BankTxnPayload): Promise<BankTxn> {
    return this.crudApi.create<BankTxn, BankTxnPayload>(ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(ENDPOINT, id);
  }

  async getById(id: string, query?: BankTxnGetQuery): Promise<BankTxn> {
    return this.crudApi.getById<BankTxn>(ENDPOINT, id, query);
  }

  async list(query: BankTxnListQuery = {}): Promise<BankTxnListResponse> {
    const normalized = normalizeLb4Filter(query);
    const params = new HttpParams().set(
      'filter',
      JSON.stringify(toLb4ListRequestFilterBody(normalized)),
    );
    const url = await this.collectionUrl();
    return firstValueFrom(this.http.get<BankTxnListResponse>(url, { params }));
  }

  async count(query: BankTxnListQuery = {}): Promise<number> {
    return this.crudApi.count(ENDPOINT, query);
  }

  async update(id: string, payload: BankTxnPayload): Promise<BankTxn> {
    return this.crudApi.update<BankTxn, BankTxnPayload>(ENDPOINT, id, payload);
  }

  async createJournal(
    bankTxnId: string,
    payload: BankTxnJournalCreatePayload,
  ): Promise<Journal> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }
    const base = config.apiBaseUrl.replace(/\/$/, '');
    const url = `${base}/accounting/journal/bank-txn/${bankTxnId}`;
    return firstValueFrom(this.http.post<Journal>(url, payload));
  }

  private async collectionUrl(): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    return `${config.apiBaseUrl.replace(/\/$/, '')}/${ENDPOINT.replace(/^\/+/, '')}`;
  }
}
