import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import type { BankCashReport, BankCashReportQuery } from './bank-cash-report.model';
import { buildBankCashReportHttpParams } from './bank-cash-report.query';

const ENDPOINT = '/inventory/inventory-report/bank-cash';

@Injectable({ providedIn: 'root' })
export class BankCashReportService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async getBankCashReport(query: BankCashReportQuery = {}): Promise<BankCashReport> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    const base = config.apiBaseUrl.replace(/\/$/, '');
    const url = `${base}/${ENDPOINT.replace(/^\/+/, '')}`;

    return this.api.get<BankCashReport>(url, {
      params: buildBankCashReportHttpParams(query),
    });
  }
}
