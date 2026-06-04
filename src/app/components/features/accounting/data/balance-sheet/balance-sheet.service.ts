import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import type { BalanceSheetReport, BalanceSheetQuery } from './balance-sheet.model';

const ENDPOINT = '/accounting/accounting-report/balance-sheet';

@Injectable({ providedIn: 'root' })
export class BalanceSheetService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async getBalanceSheet(query?: BalanceSheetQuery): Promise<BalanceSheetReport> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    const url = `${config.apiBaseUrl.replace(/\/$/, '')}/${ENDPOINT.replace(/^\/+/, '')}`;

    let params = new HttpParams();
    if (query?.end) params = params.set('end', query.end);

    return this.api.get<BalanceSheetReport>(url, { params });
  }
}
