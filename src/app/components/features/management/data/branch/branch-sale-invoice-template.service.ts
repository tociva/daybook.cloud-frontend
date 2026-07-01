import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import { SignedUrlUploadService } from '../../../../../shared/file/signed-url-upload.service';
import {
  SignedUrlDownloadService,
  type SignedDownloadUrlResponse,
} from '../../../../../shared/file/signed-url-download.service';
import type {
  SaleInvoiceTemplateMetadata,
  SaleInvoiceTemplateType,
  SaleInvoiceTemplateUploadUrlPayload,
  SaleInvoiceTemplateUploadUrlResponse,
} from './branch-sale-invoice-template.model';

const SALE_INVOICE_TEMPLATE_ENDPOINT = '/inventory/sale-invoice/templates';

@Injectable({ providedIn: 'root' })
export class BranchSaleInvoiceTemplateService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);
  private readonly http = inject(HttpClient);
  private readonly signedUrlUpload = inject(SignedUrlUploadService);
  private readonly signedUrlDownload = inject(SignedUrlDownloadService);

  async listTemplates(): Promise<readonly SaleInvoiceTemplateMetadata[]> {
    return this.api.get<readonly SaleInvoiceTemplateMetadata[]>(
      `${await this.baseUrl()}${SALE_INVOICE_TEMPLATE_ENDPOINT}`,
    );
  }

  async getEffectiveTemplateHtml(templateType: SaleInvoiceTemplateType): Promise<string> {
    return firstValueFrom(
      this.http.get(`${await this.baseUrl()}${SALE_INVOICE_TEMPLATE_ENDPOINT}/${templateType}`, {
        headers: new HttpHeaders({ Accept: 'text/html' }),
        responseType: 'text',
      }),
    );
  }

  async getDownloadUrl(templateType: SaleInvoiceTemplateType): Promise<SignedDownloadUrlResponse> {
    return this.signedUrlDownload.get(
      `${SALE_INVOICE_TEMPLATE_ENDPOINT}/${encodeURIComponent(templateType)}/download-url`,
    );
  }

  async uploadTemplate(
    templateType: SaleInvoiceTemplateType,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<SaleInvoiceTemplateUploadUrlResponse> {
    const document = await this.createUploadUrl(templateType, {
      name: file.name,
      size: file.size,
    });

    if (!document.putUrl) {
      throw new Error(`Upload URL missing for ${file.name}.`);
    }

    await this.signedUrlUpload.uploadFileToSignedUrl(
      document.putUrl,
      this.toHtmlFile(file),
      (event) => onProgress?.(event.progress),
    );

    return document;
  }

  private async createUploadUrl(
    templateType: SaleInvoiceTemplateType,
    payload: SaleInvoiceTemplateUploadUrlPayload,
  ): Promise<SaleInvoiceTemplateUploadUrlResponse> {
    return this.api.post<
      SaleInvoiceTemplateUploadUrlResponse,
      SaleInvoiceTemplateUploadUrlPayload
    >(
      `${await this.baseUrl()}${SALE_INVOICE_TEMPLATE_ENDPOINT}/${templateType}/upload-url`,
      payload,
    );
  }

  private toHtmlFile(file: File): File {
    if (file.type === 'text/html') return file;
    return new File([file], file.name, { lastModified: file.lastModified, type: 'text/html' });
  }

  private async baseUrl(): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    return config.apiBaseUrl.replace(/\/$/, '');
  }
}
