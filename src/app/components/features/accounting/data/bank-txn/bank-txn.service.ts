import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import { CrudApiService } from '../../../../../shared/crud';
import type { Lb4Count } from '../../../../../shared/crud';
import type { Journal } from '../journal';
import type {
  BankTxn,
  BankTxnGetQuery,
  BankTxnJournalCreatePayload,
  BankTxnListQuery,
  BankTxnPayload,
} from './bank-txn.model';

const ENDPOINT = '/accounting/bank-txn';

@Injectable({ providedIn: 'root' })
export class BankTxnService {
  private readonly api = inject(ApiClientService);
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

  async list(query: BankTxnListQuery = {}): Promise<readonly BankTxn[]> {
    return this.crudApi.list<BankTxn>(ENDPOINT, query);
  }

  async count(query: BankTxnListQuery = {}): Promise<number> {
    const params =
      query.where === undefined
        ? undefined
        : new HttpParams().set('where', JSON.stringify(query.where));
    const result = await this.api.get<Lb4Count>(`${await this.collectionUrl()}/count`, {
      ...(params ? { params } : {}),
    });

    return result.count;
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
