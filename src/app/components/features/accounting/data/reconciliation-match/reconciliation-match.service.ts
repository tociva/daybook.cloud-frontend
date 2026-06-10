import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import type { ReconciliationMatch, ReconciliationMatchLinkPayload } from './reconciliation-match.model';

const ENDPOINT = '/accounting/reconciliation-match';

@Injectable({ providedIn: 'root' })
export class ReconciliationMatchService {
  private readonly appConfigStore = inject(AppConfigStore);
  private readonly http = inject(HttpClient);

  async linkToBankTxn(
    bankTxnId: string,
    journalId: string,
    payload: ReconciliationMatchLinkPayload,
  ): Promise<ReconciliationMatch> {
    const url = `${await this.baseUrl()}/bank-txn/${bankTxnId}/${journalId}`;
    return firstValueFrom(this.http.post<ReconciliationMatch>(url, payload));
  }

  async unlinkFromBankTxn(bankTxnId: string, journalId: string): Promise<void> {
    const url = `${await this.baseUrl()}/bank-txn/${bankTxnId}/${journalId}`;
    const res = await firstValueFrom(
      this.http.delete(url, { observe: 'response', responseType: 'text' }),
    );
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Unexpected response status ${res.status}.`);
    }
  }

  private async baseUrl(): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    return `${config.apiBaseUrl.replace(/\/$/, '')}/${ENDPOINT.replace(/^\/+/, '')}`;
  }
}
