import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import type { TrialBalanceReport, TrialBalanceListQuery } from './trial-balance.model';

const ENDPOINT = '/accounting/accounting-report/trial-balance';

@Injectable({ providedIn: 'root' })
export class TrialBalanceService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async getTrialBalance(query?: TrialBalanceListQuery): Promise<TrialBalanceReport> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    const url = `${config.apiBaseUrl.replace(/\/$/, '')}/${ENDPOINT.replace(/^\/+/, '')}`;

    let params = new HttpParams();
    if (query?.start) params = params.set('start', query.start);
    if (query?.end) params = params.set('end', query.end);

    return this.api.get<TrialBalanceReport>(url, { params });
  }
}
