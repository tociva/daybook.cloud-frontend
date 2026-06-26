import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import { CrudApiService } from '../../../../../shared/crud';
import { JournalSourceType } from '../journal';
import type {
  ReconciliationMatch,
  ReconciliationMatchLinkPayload,
  ReconciliationMatchListQuery,
  SourceJournalsGroup,
} from './reconciliation-match.model';

const ENDPOINT = '/accounting/reconciliation-match';

const UNLINK_SOURCE_PATH_BY_TYPE: Readonly<Partial<Record<JournalSourceType, string>>> = {
  [JournalSourceType.BANK_TXN]: 'bank-txn',
  [JournalSourceType.SALE_INVOICE]: 'sale-invoice',
  [JournalSourceType.PURCHASE_INVOICE]: 'purchase-invoice',
  [JournalSourceType.RECEIPT]: 'receipt',
  [JournalSourceType.PAYMENT]: 'payment',
  [JournalSourceType.CONTRA_TRANSACTION]: 'contra',
};

@Injectable({ providedIn: 'root' })
export class ReconciliationMatchService {
  private readonly appConfigStore = inject(AppConfigStore);
  private readonly crudApi = inject(CrudApiService);
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
    return this.unlinkJournalFromSource(JournalSourceType.BANK_TXN, bankTxnId, journalId);
  }

  async unlinkFromSaleInvoice(saleInvoiceId: string, journalId: string): Promise<void> {
    return this.unlinkJournalFromSource(JournalSourceType.SALE_INVOICE, saleInvoiceId, journalId);
  }

  async unlinkFromPurchaseInvoice(purchaseInvoiceId: string, journalId: string): Promise<void> {
    return this.unlinkJournalFromSource(
      JournalSourceType.PURCHASE_INVOICE,
      purchaseInvoiceId,
      journalId,
    );
  }

  async unlinkFromReceipt(receiptId: string, journalId: string): Promise<void> {
    return this.unlinkJournalFromSource(JournalSourceType.RECEIPT, receiptId, journalId);
  }

  async unlinkFromPayment(paymentId: string, journalId: string): Promise<void> {
    return this.unlinkJournalFromSource(JournalSourceType.PAYMENT, paymentId, journalId);
  }

  async unlinkJournalFromSource(
    sourcetype: JournalSourceType,
    sourceId: string,
    journalId: string,
  ): Promise<void> {
    const segment = UNLINK_SOURCE_PATH_BY_TYPE[sourcetype];
    if (!segment) {
      throw new Error(`Unlink is not supported for source type ${sourcetype}.`);
    }

    const url = `${await this.baseUrl()}/${segment}/${sourceId}/${journalId}`;
    const res = await firstValueFrom(
      this.http.delete(url, { observe: 'response', responseType: 'text' }),
    );
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Unexpected response status ${res.status}.`);
    }
  }

  async list(query: ReconciliationMatchListQuery = {}): Promise<readonly ReconciliationMatch[]> {
    return this.crudApi.list<ReconciliationMatch>(ENDPOINT, query);
  }

  async findByJournalIds(
    journalIds: readonly string[],
  ): Promise<readonly ReconciliationMatch[]> {
    if (!journalIds.length) return [];

    return this.list({
      where: { journalid: { inq: journalIds } },
      limit: journalIds.length,
    });
  }

  async findJournalsBySourceIds(
    sourcetype: string,
    sourceIds: readonly string[],
  ): Promise<readonly SourceJournalsGroup[]> {
    if (!sourceIds.length) return [];

    const url = `${await this.baseUrl()}/sources/${sourcetype}`;
    const params = new HttpParams().set('sourceids', sourceIds.join(','));
    return firstValueFrom(this.http.get<readonly SourceJournalsGroup[]>(url, { params }));
  }

  private async baseUrl(): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    return `${config.apiBaseUrl.replace(/\/$/, '')}/${ENDPOINT.replace(/^\/+/, '')}`;
  }
}
