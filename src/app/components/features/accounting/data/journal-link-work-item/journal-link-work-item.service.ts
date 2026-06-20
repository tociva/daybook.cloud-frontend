import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import { normalizeJournalLinkWorkItemQuery } from './journal-link-work-item.query';
import type {
  JournalLinkWorkItem,
  JournalLinkWorkItemCountResponse,
  JournalLinkWorkItemQuery,
} from './journal-link-work-item.model';

const ENDPOINT = '/accounting/journal-link-work-items';

@Injectable({ providedIn: 'root' })
export class JournalLinkWorkItemService {
  private readonly api = inject(ApiClientService);
  private readonly appConfigStore = inject(AppConfigStore);

  async list(query: JournalLinkWorkItemQuery = {}): Promise<readonly JournalLinkWorkItem[]> {
    return this.api.get<readonly JournalLinkWorkItem[]>(await this.collectionUrl(), {
      params: this.toParams(query),
    });
  }

  async count(query: JournalLinkWorkItemQuery = {}): Promise<number> {
    const result = await this.api.get<JournalLinkWorkItemCountResponse>(
      `${await this.collectionUrl()}/count`,
      {
        params: this.toCountParams(query),
      },
    );

    return typeof result === 'number' ? result : result.count;
  }

  private toParams(query: JournalLinkWorkItemQuery): HttpParams {
    const normalized = normalizeJournalLinkWorkItemQuery(query);
    return this.appendParams(new HttpParams(), normalized);
  }

  private toCountParams(query: JournalLinkWorkItemQuery): HttpParams {
    const { limit: _limit, skip: _skip, order: _order, ...filterQuery } =
      normalizeJournalLinkWorkItemQuery(query);
    return this.appendParams(new HttpParams(), filterQuery);
  }

  private appendParams(params: HttpParams, query: JournalLinkWorkItemQuery): HttpParams {
    let next = params;

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      next = next.set(key, String(value));
    }

    return next;
  }

  private async collectionUrl(): Promise<string> {
    const config = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!config) {
      throw new Error('Unable to load app configuration.');
    }

    return `${config.apiBaseUrl.replace(/\/$/, '')}${ENDPOINT}`;
  }
}
