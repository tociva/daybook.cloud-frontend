import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../core/config/app-config.store';
import type {
  AccountantDashboardSummary,
  AccountantDashboardSummaryQuery,
} from './accountant-dashboard.model';

const ENDPOINT = '/accounting/accountant-dashboard/summary';

@Injectable({ providedIn: 'root' })
export class AccountantDashboardService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async loadSummary(
    query: AccountantDashboardSummaryQuery = {},
  ): Promise<AccountantDashboardSummary> {
    return this.api.get<AccountantDashboardSummary>(`${await this.baseUrl()}${ENDPOINT}`, {
      params: this.toParams(query),
    });
  }

  private async baseUrl(): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    return config.apiBaseUrl.replace(/\/$/, '');
  }

  private toParams(query: AccountantDashboardSummaryQuery): HttpParams {
    let params = new HttpParams();

    if (query.asOfDate) params = params.set('asOfDate', query.asOfDate);
    if (query.branchid) params = params.set('branchid', query.branchid);
    if (query.fiscalyearid) params = params.set('fiscalyearid', query.fiscalyearid);

    return params;
  }
}
