import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import { CrudApiService } from '../../../../../shared/crud';
import { SignedUrlUploadService } from '../../../../../shared/file/signed-url-upload.service';
import { SignedUrlDownloadService } from '../../../../../shared/file/signed-url-download.service';
import type {
  Organization,
  OrganizationBootstrap,
  OrganizationLogoDocument,
  OrganizationLogoReadUrl,
  OrganizationLogoUploadPayload,
  OrganizationLogoVariant,
  OrganizationListQuery,
  OrganizationPayload,
} from './organization.model';

const ORG_ENDPOINT = '/organization/organization';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);
  private readonly crudApi = inject(CrudApiService);
  private readonly signedUrlUpload = inject(SignedUrlUploadService);
  private readonly signedUrlDownload = inject(SignedUrlDownloadService);

  async create(payload: OrganizationPayload): Promise<Organization> {
    return this.crudApi.create<Organization, OrganizationPayload>(ORG_ENDPOINT, payload);
  }

  async createWithDefaultBranch(payload: OrganizationBootstrap): Promise<Organization> {
    return this.crudApi.create<Organization, OrganizationBootstrap>(
      `${ORG_ENDPOINT}/bootstrap-with-data`,
      payload,
    );
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(ORG_ENDPOINT, id);
  }

  async getById(id: string): Promise<Organization> {
    return this.crudApi.getById<Organization>(ORG_ENDPOINT, id);
  }

  async list(query: OrganizationListQuery = {}): Promise<readonly Organization[]> {
    return this.crudApi.list<Organization>(ORG_ENDPOINT, query);
  }

  async count(query: OrganizationListQuery = {}): Promise<number> {
    return this.crudApi.count(ORG_ENDPOINT, query);
  }

  async update(id: string, payload: OrganizationPayload): Promise<Organization> {
    return this.crudApi.update<Organization, OrganizationPayload>(ORG_ENDPOINT, id, payload);
  }

  async getLogoDocument(documentId: string): Promise<OrganizationLogoDocument> {
    return this.api.get<OrganizationLogoDocument>(
      `${await this.baseUrl()}/storage/stored-document/${documentId}`,
    );
  }

  async getLogoReadUrl(
    organizationId: string,
    variant: OrganizationLogoVariant,
  ): Promise<OrganizationLogoReadUrl> {
    return this.signedUrlDownload.get<OrganizationLogoReadUrl>(
      `${ORG_ENDPOINT}/${encodeURIComponent(organizationId)}/logo/${encodeURIComponent(variant)}/url`,
    );
  }

  async uploadLogo(
    organizationId: string,
    variant: OrganizationLogoVariant,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<OrganizationLogoDocument> {
    const document = await this.api.post<OrganizationLogoDocument, OrganizationLogoUploadPayload>(
      `${await this.baseUrl()}${ORG_ENDPOINT}/${organizationId}/logo/${variant}`,
      this.toLogoUploadPayload(file),
    );

    if (!document.putUrl) {
      throw new Error(`Upload URL missing for ${file.name}.`);
    }

    await this.signedUrlUpload.uploadFileToSignedUrl(document.putUrl, file, (event) => {
      onProgress?.(event.progress);
    });

    return document;
  }

  private toLogoUploadPayload(file: File): OrganizationLogoUploadPayload {
    return {
      name: file.name,
      type: this.logoType(file),
      size: file.size,
    };
  }

  private logoType(file: File): string {
    const extension = file.name.split('.').pop()?.trim().toLowerCase();
    if (extension && extension !== file.name.toLowerCase()) {
      return extension;
    }

    return file.type || 'application/octet-stream';
  }

  private async baseUrl(): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    return config.apiBaseUrl.replace(/\/$/, '');
  }
}
