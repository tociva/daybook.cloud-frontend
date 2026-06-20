import { signal } from '@angular/core';
import type { HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import type { AppConfig } from '../../../../../core/config/app-config.model';
import { JournalLinkWorkItemService } from './journal-link-work-item.service';

const config = (apiBaseUrl: string): AppConfig => ({
  apiBaseUrl,
  auth: {
    audience: null,
    authority: 'https://auth.example.com',
    clientId: 'client-id',
    postLoginRedirect: null,
    postLogoutRedirect: '/auth/logout',
    redirectUri: '/auth/callback',
    scope: 'openid profile email',
  },
});

describe('JournalLinkWorkItemService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('lists work items with first-class query params and clamps limit to the API max', async () => {
    const get = vi.fn(async (_url: string, _options?: { params: HttpParams }) => []);

    TestBed.configureTestingModule({
      providers: [
        JournalLinkWorkItemService,
        { provide: ApiClientService, useValue: { get } },
        {
          provide: AppConfigStore,
          useValue: {
            config: signal(config('https://api.example.com/')),
            load: vi.fn(),
          },
        },
      ],
    });

    const service = TestBed.inject(JournalLinkWorkItemService);
    await service.list({
      limit: 500,
      order: 'date ASC',
      skip: 25,
      sourceType: 'sale_invoice',
      status: 'not_fully_linked',
    });

    expect(get).toHaveBeenCalledOnce();
    expect(get.mock.calls[0][0]).toBe('https://api.example.com/accounting/journal-link-work-items');
    const params = get.mock.calls[0][1]?.params;
    expect(params).toBeDefined();
    const httpParams = params as HttpParams;
    expect(httpParams.get('sourceType')).toBe('sale_invoice');
    expect(httpParams.get('status')).toBe('not_fully_linked');
    expect(httpParams.get('limit')).toBe('200');
    expect(httpParams.get('skip')).toBe('25');
    expect(httpParams.get('order')).toBe('date ASC');
  });

  it('counts work items with filter params only', async () => {
    const get = vi.fn(async (_url: string, _options?: { params: HttpParams }) => ({ count: 12 }));

    TestBed.configureTestingModule({
      providers: [
        JournalLinkWorkItemService,
        { provide: ApiClientService, useValue: { get } },
        {
          provide: AppConfigStore,
          useValue: {
            config: signal(config('https://api.example.com')),
            load: vi.fn(),
          },
        },
      ],
    });

    const service = TestBed.inject(JournalLinkWorkItemService);
    await expect(
      service.count({
        fromDate: '2026-04-01',
        limit: 50,
        order: 'date ASC',
        skip: 50,
        sourceType: 'bank_txn',
        status: 'partial',
        toDate: '2026-06-19',
      }),
    ).resolves.toBe(12);

    expect(get).toHaveBeenCalledOnce();
    expect(get.mock.calls[0][0]).toBe(
      'https://api.example.com/accounting/journal-link-work-items/count',
    );
    const params = get.mock.calls[0][1]?.params;
    expect(params).toBeDefined();
    const httpParams = params as HttpParams;
    expect(httpParams.get('sourceType')).toBe('bank_txn');
    expect(httpParams.get('status')).toBe('partial');
    expect(httpParams.get('fromDate')).toBe('2026-04-01');
    expect(httpParams.get('toDate')).toBe('2026-06-19');
    expect(httpParams.has('limit')).toBe(false);
    expect(httpParams.has('skip')).toBe(false);
    expect(httpParams.has('order')).toBe(false);
  });
});
