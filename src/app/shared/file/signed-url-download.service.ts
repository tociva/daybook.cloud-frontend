import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../core/api/api-client.service';
import { getApiErrorMessage, isApiErrorStatus } from '../../core/api/api-error.util';
import { AppConfigStore } from '../../core/config/app-config.store';

export type SignedDownloadUrlResponse = Readonly<{
  getUrl: string;
  expiresIn: number;
}>;

@Injectable({ providedIn: 'root' })
export class SignedUrlDownloadService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async get<TResponse extends SignedDownloadUrlResponse = SignedDownloadUrlResponse>(
    relativeEndpoint: string,
  ): Promise<TResponse> {
    const response = await this.api.get<unknown>(`${await this.baseUrl()}${this.normalizePath(relativeEndpoint)}`);
    return this.normalizeResponse<TResponse>(response);
  }

  private normalizeResponse<TResponse extends SignedDownloadUrlResponse>(value: unknown): TResponse {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Download URL response is invalid.');
    }

    const response = value as Record<string, unknown>;
    const getUrl = typeof response['getUrl'] === 'string' ? response['getUrl'].trim() : '';
    if (!getUrl) {
      throw new Error('Download URL is missing from response.');
    }

    const expiresIn = response['expiresIn'];
    if (typeof expiresIn !== 'number' || !Number.isFinite(expiresIn)) {
      throw new Error('Download URL expiry is missing from response.');
    }

    return { ...response, getUrl, expiresIn } as TResponse;
  }

  private normalizePath(value: string): string {
    return `/${value.replace(/^\/+/, '')}`;
  }

  private async baseUrl(): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }
    return config.apiBaseUrl.replace(/\/$/, '');
  }
}

export function startSignedDownload(response: SignedDownloadUrlResponse): void {
  window.location.href = response.getUrl;
}

export function getDownloadErrorMessage(error: unknown, fallbackMessage: string): string {
  if (isApiErrorStatus(error, 409)) {
    return 'The document upload is not complete yet.';
  }
  return getApiErrorMessage(error, fallbackMessage);
}
