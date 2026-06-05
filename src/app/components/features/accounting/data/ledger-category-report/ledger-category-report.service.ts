import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import type { LedgerCategoryReport, LedgerCategoryReportQuery } from './ledger-category-report.model';

const ENDPOINT_PREFIX = '/accounting/accounting-report/ledger-category';

@Injectable({ providedIn: 'root' })
export class LedgerCategoryReportService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async getLedgerCategoryReport(
    ledgercategoryid: string,
    query?: LedgerCategoryReportQuery,
  ): Promise<LedgerCategoryReport> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    const base = config.apiBaseUrl.replace(/\/$/, '');
    const path = `${ENDPOINT_PREFIX}/${encodeURIComponent(ledgercategoryid)}`.replace(/^\/+/, '');
    const url = `${base}/${path}`;

    let params = new HttpParams();
    if (query?.start) params = params.set('start', query.start);
    if (query?.end) params = params.set('end', query.end);

    return this.api.get<LedgerCategoryReport>(url, { params });
  }
}
