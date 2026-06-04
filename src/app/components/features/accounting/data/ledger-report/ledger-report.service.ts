import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import type { LedgerReport, LedgerReportQuery } from './ledger-report.model';

const ENDPOINT_PREFIX = '/accounting/accounting-report/ledger';

@Injectable({ providedIn: 'root' })
export class LedgerReportService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async getLedgerReport(ledgerid: string, query?: LedgerReportQuery): Promise<LedgerReport> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    const base = config.apiBaseUrl.replace(/\/$/, '');
    const path = `${ENDPOINT_PREFIX}/${encodeURIComponent(ledgerid)}`.replace(/^\/+/, '');
    const url = `${base}/${path}`;

    let params = new HttpParams();
    if (query?.start) params = params.set('start', query.start);
    if (query?.end) params = params.set('end', query.end);

    return this.api.get<LedgerReport>(url, { params });
  }
}
