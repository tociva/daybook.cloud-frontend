import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../core/api/api-client.service';
import { AppConfigStore } from '../../core/config/app-config.store';
import type { Lb4Count, Lb4ListQuery } from './lb4-query';
import { normalizeLb4Filter } from './lb4-query';

@Injectable({ providedIn: 'root' })
export class CrudApiService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async create<TEntity, TPayload>(endpointPath: string, payload: TPayload): Promise<TEntity> {
    return this.api.post<TEntity, TPayload>(await this.collectionUrl(endpointPath), payload);
  }

  async delete(endpointPath: string, id: string): Promise<void> {
    return this.api.delete<void>(`${await this.collectionUrl(endpointPath)}/${id}`);
  }

  async getById<TEntity>(endpointPath: string, id: string): Promise<TEntity> {
    return this.api.get<TEntity>(`${await this.collectionUrl(endpointPath)}/${id}`);
  }

  async list<TEntity>(endpointPath: string, query: Lb4ListQuery = {}): Promise<readonly TEntity[]> {
    const params = new HttpParams().set('filter', JSON.stringify(normalizeLb4Filter(query)));

    return this.api.get<readonly TEntity[]>(await this.collectionUrl(endpointPath), { params });
  }

  async count(endpointPath: string, query: Lb4ListQuery = {}): Promise<number> {
    const where = query.where;
    const params =
      where === undefined ? undefined : new HttpParams().set('where', JSON.stringify(where));
    const result = await this.api.get<Lb4Count>(`${await this.collectionUrl(endpointPath)}/count`, {
      ...(params ? { params } : {}),
    });

    return result.count;
  }

  async update<TEntity, TPayload>(
    endpointPath: string,
    id: string,
    payload: TPayload,
  ): Promise<TEntity> {
    return this.api.patch<TEntity, TPayload>(
      `${await this.collectionUrl(endpointPath)}/${id}`,
      payload,
    );
  }

  private async collectionUrl(endpointPath: string): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    return `${config.apiBaseUrl.replace(/\/$/, '')}/${endpointPath.replace(/^\/+/, '')}`;
  }
}
