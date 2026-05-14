import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../core/api/api-client.service';
import { AppConfigStore } from '../../core/config/app-config.store';
import type { Lb4Count, Lb4Include, Lb4ListQuery } from './lb4-query';
import { normalizeLb4Filter, toLb4ListRequestFilterBody } from './lb4-query';

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

  /**
   * Optional query matches common LoopBack-style `GET …/:id?filter=` payloads,
   * e.g. `{ includes: ['category'] }` → `filter={"include":["category"]}`.
   */
  async getById<TEntity>(
    endpointPath: string,
    id: string,
    query?: Readonly<{ includes?: readonly Lb4Include[] }>,
  ): Promise<TEntity> {
    const url = `${await this.collectionUrl(endpointPath)}/${id}`;
    const include = query?.includes?.filter((entry) =>
      typeof entry === 'string' ? entry.length > 0 : entry.relation.length > 0,
    );
    if (!include?.length) {
      return this.api.get<TEntity>(url);
    }

    const params = new HttpParams().set('filter', JSON.stringify({ include }));
    return this.api.get<TEntity>(url, { params });
  }

  async list<TEntity>(endpointPath: string, query: Lb4ListQuery = {}): Promise<readonly TEntity[]> {
    const normalized = normalizeLb4Filter(query);
    const params = new HttpParams().set(
      'filter',
      JSON.stringify(toLb4ListRequestFilterBody(normalized)),
    );

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
