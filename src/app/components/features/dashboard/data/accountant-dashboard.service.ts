import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../core/config/app-config.store';
import type { AccountantDashboardSummary } from './accountant-dashboard.model';

const ENDPOINT = '/accounting/accountant-dashboard/summary';

@Injectable({ providedIn: 'root' })
export class AccountantDashboardService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async loadSummary(): Promise<AccountantDashboardSummary> {
    return this.api.get<AccountantDashboardSummary>(`${await this.baseUrl()}${ENDPOINT}`);
  }

  private async baseUrl(): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    return config.apiBaseUrl.replace(/\/$/, '');
  }
}

