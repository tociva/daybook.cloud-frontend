import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../../core/config/app-config.store';
import type {
  GstReconciliationDetailResponse,
  GstReconciliationImportPayload,
  GstReconciliationImportResponse,
  GstReconciliationQuery,
  GstReconciliationReturnType,
  GstReconciliationSummaryQuery,
  GstReconciliationSummaryResponse,
} from './gst-reconciliation.model';

const ENDPOINT = '/inventory/gst-reconciliation';

@Injectable({ providedIn: 'root' })
export class GstReconciliationService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async importUploadedFile(
    payload: GstReconciliationImportPayload,
  ): Promise<GstReconciliationImportResponse> {
    const formData = new FormData();
    formData.append('branchid', payload.branchid);
    formData.append('month', String(payload.month));
    formData.append('returnType', payload.returnType);
    formData.append('sourceFormat', payload.sourceFormat);
    formData.append('file', payload.file, payload.file.name);

    // Pass FormData as the body; HttpClient sets the multipart boundary header automatically.
    return this.api.post<GstReconciliationImportResponse, FormData>(
      `${await this.baseUrl()}${ENDPOINT}/import-uploaded-file`,
      formData,
    );
  }

  async loadSummary(
    query: GstReconciliationSummaryQuery,
  ): Promise<GstReconciliationSummaryResponse> {
    return this.api.get<GstReconciliationSummaryResponse>(`${await this.baseUrl()}${ENDPOINT}/summary`, {
      params: this.toParams(query),
    });
  }

  async loadDetail(
    returnType: GstReconciliationReturnType,
    month: number,
    query: GstReconciliationQuery,
  ): Promise<GstReconciliationDetailResponse> {
    return this.api.get<GstReconciliationDetailResponse>(
      `${await this.baseUrl()}${ENDPOINT}/${returnType}/${month}`,
      { params: this.toParams(query) },
    );
  }

  private async baseUrl(): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    return config.apiBaseUrl.replace(/\/$/, '');
  }

  private toParams(query: GstReconciliationQuery): HttpParams {
    return new HttpParams().set('branchid', query.branchid);
  }
}
