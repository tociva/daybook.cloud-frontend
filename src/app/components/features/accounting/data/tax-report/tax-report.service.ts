import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import type { TaxReportQuery, TaxReportResponse } from './tax-report.model';

const ENDPOINT = '/accounting/accounting-report/tax';

@Injectable({ providedIn: 'root' })
export class TaxReportService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async getTaxReport(query: TaxReportQuery): Promise<TaxReportResponse> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    const url = `${config.apiBaseUrl.replace(/\/$/, '')}/${ENDPOINT.replace(/^\/+/, '')}`;

    let params = new HttpParams();
    params = params.set('start', query.start);
    params = params.set('end', query.end);

    return this.api.get<TaxReportResponse>(url, { params });
  }
}
