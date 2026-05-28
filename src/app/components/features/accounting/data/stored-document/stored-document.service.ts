import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  StoredDocument,
  StoredDocumentCreatePayload,
  StoredDocumentGetQuery,
  StoredDocumentListQuery,
  StoredDocumentUpdatePayload,
} from './stored-document.model';

const ENDPOINT = '/storage/stored-document';

type StoredDocumentCountResponse = Readonly<{
  count: number;
}>;

@Injectable({ providedIn: 'root' })
export class StoredDocumentService {
  private readonly crudApi = inject(CrudApiService);
  private readonly http = inject(HttpClient);
  private readonly appConfigStore = inject(AppConfigStore);

  async create(payload: StoredDocumentCreatePayload): Promise<StoredDocument> {
    return this.crudApi.create<StoredDocument, StoredDocumentCreatePayload>(ENDPOINT, payload);
  }

  async getById(id: string, query?: StoredDocumentGetQuery): Promise<StoredDocument> {
    return this.crudApi.getById<StoredDocument>(ENDPOINT, id, query);
  }

  async list(query: StoredDocumentListQuery = {}): Promise<readonly StoredDocument[]> {
    return this.crudApi.list<StoredDocument>(ENDPOINT, query);
  }

  /**
   * Count endpoint expects `filter` query param as per spec:
   * GET /storage/stored-document/count?filter=...
   */
  async count(query: StoredDocumentListQuery = {}): Promise<number> {
    const params = new HttpParams().set('filter', JSON.stringify(query));
    const response = await this.http.get<StoredDocumentCountResponse>(
      `${await this.collectionUrl()}/count`,
      { params },
    );
    const result = await firstValueFrom(response);
    return result.count;
  }

  /** Backend returns 204 No Content. */
  async update(id: string, payload: StoredDocumentUpdatePayload): Promise<void> {
    const response = await this.http.patch(
      `${await this.collectionUrl()}/${id}`,
      payload,
      { observe: 'response', responseType: 'text' },
    );
    const result = await firstValueFrom(response);
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Unexpected response status ${result.status}.`);
    }
  }

  /** Backend returns 204 No Content. */
  async delete(id: string): Promise<void> {
    const response = await this.http.delete(
      `${await this.collectionUrl()}/${id}`,
      { observe: 'response', responseType: 'text' },
    );
    const result = await firstValueFrom(response);
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Unexpected response status ${result.status}.`);
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
