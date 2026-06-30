import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import { SignedUrlUploadService } from '../../../../../shared/file/signed-url-upload.service';
import type {
  GstReconciliationDetailResponse,
  GstReconciliationRefreshPayload,
  GstReconciliationRefreshResponse,
  GstReconciliationReturnType,
  GstReconciliationSummaryResponse,
  GstReconciliationUploadUrlPayload,
  GstReconciliationUploadUrlResponse,
  GstSourceFormat,
} from './gst-reconciliation.model';

const ENDPOINT = '/gst-reconciliation';
const GST_UPLOAD_CONTENT_TYPES: Record<GstSourceFormat, string> = {
  json: 'application/json',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

@Injectable({ providedIn: 'root' })
export class GstReconciliationService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);
  private readonly signedUrlUpload = inject(SignedUrlUploadService);

  /** Step 1: Obtain a signed upload URL for the GST return file. */
  async createUploadUrl(
    payload: GstReconciliationUploadUrlPayload,
  ): Promise<GstReconciliationUploadUrlResponse> {
    return this.api.post<GstReconciliationUploadUrlResponse, GstReconciliationUploadUrlPayload>(
      `${await this.baseUrl()}${ENDPOINT}/upload-url`,
      payload,
    );
  }

  /**
   * Step 2: Upload the file directly to the signed URL via a plain HTTP PUT.
   * We use fetch() here because HttpClient would add the auth header to the
   * pre-signed S3 URL which would cause a signature mismatch.
   */
  async uploadFileToSignedUrl(
    putUrl: string,
    file: File,
    sourceFormat: GstSourceFormat,
  ): Promise<void> {
    await this.signedUrlUpload.uploadFileToSignedUrl(
      putUrl,
      file,
      undefined,
      GST_UPLOAD_CONTENT_TYPES[sourceFormat],
    );
  }

  /** Step 3: Trigger reconciliation refresh after the file has been uploaded. */
  async refresh(
    payload: GstReconciliationRefreshPayload,
  ): Promise<GstReconciliationRefreshResponse> {
    return this.api.post<GstReconciliationRefreshResponse, GstReconciliationRefreshPayload>(
      `${await this.baseUrl()}${ENDPOINT}/refresh`,
      payload,
    );
  }

  /** Fetch the 12-month summary for all return types. */
  async loadSummary(): Promise<GstReconciliationSummaryResponse> {
    return this.api.get<GstReconciliationSummaryResponse>(
      `${await this.baseUrl()}${ENDPOINT}/summary`,
    );
  }

  /** Fetch monthly reconciliation detail for a specific return type and month. */
  async loadDetail(
    returnType: GstReconciliationReturnType,
    month: number,
  ): Promise<GstReconciliationDetailResponse> {
    return this.api.get<GstReconciliationDetailResponse>(
      `${await this.baseUrl()}${ENDPOINT}/${returnType}/${month}`,
    );
  }

  private async baseUrl(): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }
    return config.apiBaseUrl.replace(/\/$/, '');
  }
}
