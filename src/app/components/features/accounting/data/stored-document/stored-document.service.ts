import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  StoredDocument,
  StoredDocumentCreatePayload,
  StoredDocumentGetQuery,
  StoredDocumentListQuery,
  StoredDocumentUpdatePayload,
  StoredDocumentValidateUploadResponse,
} from './stored-document.model';

const ENDPOINT = '/storage/stored-document';

@Injectable({ providedIn: 'root' })
export class StoredDocumentService {
  private readonly api = inject(ApiClientService);
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

  async count(query: StoredDocumentListQuery = {}): Promise<number> {
    return this.crudApi.count(ENDPOINT, query);
  }

  async validateUploads(): Promise<StoredDocumentValidateUploadResponse> {
    return this.api.post<StoredDocumentValidateUploadResponse, null>(
      `${await this.collectionUrl()}/validate-upload`,
      null,
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  async getDownloadUrl(id: string): Promise<string> {
    const response = await this.api.get<Record<string, unknown> | string>(
      `${await this.collectionUrl()}/${id}/download-url`,
    );
    const url = this.extractSignedUrl(response);
    if (!url) {
      throw new Error('Download URL is missing from response.');
    }
    return url;
  }

  /** Backend returns 204 No Content. */
  async update(id: string, payload: StoredDocumentUpdatePayload): Promise<void> {
    const response = await this.http.patch(`${await this.collectionUrl()}/${id}`, payload, {
      observe: 'response',
      responseType: 'text',
    });
    const result = await firstValueFrom(response);
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Unexpected response status ${result.status}.`);
    }
  }

  /** Backend returns 204 No Content. */
  async delete(id: string): Promise<void> {
    const response = await this.http.delete(`${await this.collectionUrl()}/${id}`, {
      observe: 'response',
      responseType: 'text',
    });
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

  private extractSignedUrl(payload: Record<string, unknown> | string): string | null {
    if (typeof payload === 'string') {
      const normalized = payload.trim();
      return normalized.length ? normalized : null;
    }

    const candidate =
      payload['downloadUrl'] ??
      payload['signedUrl'] ??
      payload['url'] ??
      payload['getUrl'] ??
      payload['href'];
    if (typeof candidate !== 'string') return null;
    const normalized = candidate.trim();
    return normalized.length ? normalized : null;
  }
}
