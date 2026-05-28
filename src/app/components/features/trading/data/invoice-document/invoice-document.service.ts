import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import { SignedUrlUploadService } from '../../../../../shared/file/signed-url-upload.service';
import type {
  InvoiceDocumentCreatePayload,
  InvoiceDocumentResourceType,
  StoredDocument,
} from './invoice-document.model';

const INVOICE_DOCUMENT_ENDPOINTS: Record<InvoiceDocumentResourceType, string> = {
  saleInvoice: '/inventory/sale-invoice',
  purchaseInvoice: '/inventory/purchase-invoice',
  purchaseReturn: '/inventory/purchase-return',
  journal: '/accounting/journal',
};

@Injectable({ providedIn: 'root' })
export class InvoiceDocumentService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);
  private readonly signedUrlUpload = inject(SignedUrlUploadService);

  async attachInvoiceDocuments(
    resourceType: InvoiceDocumentResourceType,
    parentId: string,
    files: readonly File[],
    onProgress?: (file: File, document: StoredDocument, progress: number) => void,
  ): Promise<readonly StoredDocument[]> {
    const validFiles = files.filter((file) => file.size > 0);
    if (!validFiles.length) {
      throw new Error('Select at least one non-empty file to attach.');
    }

    const documents = await this.createDocumentMetadata(resourceType, parentId, validFiles);

    await Promise.all(
      documents.map(async (document, index) => {
        const file = validFiles[index];
        if (!file) return;
        if (!document.putUrl) {
          throw new Error(`Upload URL missing for ${document.name}.`);
        }

        await this.signedUrlUpload.uploadFileToSignedUrl(document.putUrl, file, (event) => {
          onProgress?.(file, document, event.progress);
        });
      }),
    );

    return documents;
  }

  async deleteInvoiceDocument(
    resourceType: InvoiceDocumentResourceType,
    parentId: string,
    docId: string,
  ): Promise<void> {
    await this.api.delete<void>(`${await this.documentsUrl(resourceType, parentId)}/${docId}`);
  }

  private async createDocumentMetadata(
    resourceType: InvoiceDocumentResourceType,
    parentId: string,
    files: readonly File[],
  ): Promise<readonly StoredDocument[]> {
    const payload = files.map((file) => this.toDocumentPayload(file));
    return this.api.post<readonly StoredDocument[], readonly InvoiceDocumentCreatePayload[]>(
      await this.documentsUrl(resourceType, parentId),
      payload,
    );
  }

  private toDocumentPayload(file: File): InvoiceDocumentCreatePayload {
    const extension = this.fileExtension(file.name);
    return {
      name: file.name,
      size: file.size,
      ...(extension ? { type: extension } : {}),
      props: {
        mimeType: file.type || 'application/octet-stream',
        originalFileName: file.name,
        source: 'invoice-detail',
      },
    };
  }

  private fileExtension(fileName: string): string | undefined {
    const extension = fileName.split('.').pop()?.trim().toLowerCase();
    return extension && extension !== fileName.toLowerCase() ? extension : undefined;
  }

  private async documentsUrl(
    resourceType: InvoiceDocumentResourceType,
    parentId: string,
  ): Promise<string> {
    const endpoint = INVOICE_DOCUMENT_ENDPOINTS[resourceType];
    return `${await this.baseUrl()}${endpoint}/${parentId}/documents`;
  }

  private async baseUrl(): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }
    return config.apiBaseUrl.replace(/\/$/, '');
  }
}
