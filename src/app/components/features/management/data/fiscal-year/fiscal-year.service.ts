import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import {
  SignedUrlDownloadService,
  type SignedDownloadUrlResponse,
} from '../../../../../shared/file/signed-url-download.service';
import type {
  FiscalYear,
  FiscalYearGetQuery,
  FiscalYearListQuery,
  FiscalYearPayload,
} from './fiscal-year.model';

const FISCAL_YEAR_ENDPOINT = '/organization/fiscal-year';

@Injectable({ providedIn: 'root' })
export class FiscalYearService {
  private readonly crudApi = inject(CrudApiService);
  private readonly signedUrlDownload = inject(SignedUrlDownloadService);

  async create(payload: FiscalYearPayload): Promise<FiscalYear> {
    return this.crudApi.create<FiscalYear, FiscalYearPayload>(FISCAL_YEAR_ENDPOINT, payload);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(FISCAL_YEAR_ENDPOINT, id);
  }

  async getById(id: string, query?: FiscalYearGetQuery): Promise<FiscalYear> {
    return this.crudApi.getById<FiscalYear>(FISCAL_YEAR_ENDPOINT, id, query);
  }

  async list(query: FiscalYearListQuery = {}): Promise<readonly FiscalYear[]> {
    return this.crudApi.list<FiscalYear>(FISCAL_YEAR_ENDPOINT, query);
  }

  async count(query: FiscalYearListQuery = {}): Promise<number> {
    return this.crudApi.count(FISCAL_YEAR_ENDPOINT, query);
  }

  async update(id: string, payload: FiscalYearPayload): Promise<FiscalYear> {
    return this.crudApi.update<FiscalYear, FiscalYearPayload>(FISCAL_YEAR_ENDPOINT, id, payload);
  }

  async getDocumentDownloadUrl(documentId: string): Promise<SignedDownloadUrlResponse> {
    return this.signedUrlDownload.get(
      `/storage/fiscal-year-document/${encodeURIComponent(documentId)}/download-url`,
    );
  }
}
