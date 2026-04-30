import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import type {
  BankCash,
  BankCashCount,
  BankCashListQuery,
  BankCashPayload,
} from './bank-cash.model';

type LoopbackFilter = Readonly<{
  limit: number;
  offset: number;
  order?: readonly string[];
  where?: Record<string, unknown>;
}>;

@Injectable({ providedIn: 'root' })
export class BankCashService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async create(payload: BankCashPayload): Promise<BankCash> {
    return this.api.post<BankCash, BankCashPayload>(await this.collectionUrl(), payload);
  }

  async delete(id: string): Promise<void> {
    return this.api.delete<void>(`${await this.collectionUrl()}/${id}`);
  }

  async getById(id: string): Promise<BankCash> {
    return this.api.get<BankCash>(`${await this.collectionUrl()}/${id}`);
  }

  async list(query: BankCashListQuery = {}): Promise<readonly BankCash[]> {
    const params = new HttpParams().set('filter', JSON.stringify(this.buildFilter(query)));

    return this.api.get<readonly BankCash[]>(await this.collectionUrl(), { params });
  }

  async count(): Promise<number> {
    const result = await this.api.get<BankCashCount>(`${await this.collectionUrl()}/count`);

    return result.count;
  }

  async update(id: string, payload: BankCashPayload): Promise<BankCash> {
    return this.api.patch<BankCash, BankCashPayload>(`${await this.collectionUrl()}/${id}`, payload);
  }

  private async collectionUrl(): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    return `${config.apiBaseUrl.replace(/\/$/, '')}/inventory/bank-cash`;
  }

  private buildFilter(query: BankCashListQuery): LoopbackFilter {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    const search = query.search?.trim();
    const filter: LoopbackFilter = {
      limit,
      offset,
      ...(query.sort ? { order: [query.sort] } : {}),
      ...(search
        ? {
            where: {
              or: [
                { name: { ilike: `%${search}%` } },
                { description: { ilike: `%${search}%` } },
              ],
            },
          }
        : {}),
    };

    return filter;
  }
}

