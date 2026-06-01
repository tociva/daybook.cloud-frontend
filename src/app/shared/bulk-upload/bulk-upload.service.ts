import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../core/api/api-client.service';
import { AppConfigStore } from '../../core/config/app-config.store';

@Injectable({ providedIn: 'root' })
export class BulkUploadService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async upload(endpointPath: string, file: File): Promise<readonly unknown[]> {
    const form = new FormData();
    form.append('file', file);

    return this.api.post<readonly unknown[], FormData>(await this.endpointUrl(endpointPath), form);
  }

  private async endpointUrl(endpointPath: string): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    return `${config.apiBaseUrl.replace(/\/$/, '')}/${endpointPath.replace(/^\/+/, '')}`;
  }
}
