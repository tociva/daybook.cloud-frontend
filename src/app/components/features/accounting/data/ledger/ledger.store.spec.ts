import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LedgerCachePreferencesStore } from '../../../../../core/preferences/ledger-cache-preferences.store';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type { UserSession } from '../../../management/data/user-session/user-session.model';
import type { Ledger } from './ledger.model';
import { LedgerService } from './ledger.service';
import { LedgerStore } from './ledger.store';

type LedgerServiceMock = Readonly<{
  count: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}>;

type Deferred<T> = Readonly<{
  promise: Promise<T>;
  reject: (error: unknown) => void;
  resolve: (value: T) => void;
}>;

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

const ledgers: readonly Ledger[] = [
  {
    id: 'cash',
    name: 'Cash',
    categoryid: 'asset',
    category: { id: 'asset', name: 'Assets' },
    openingdr: 100,
    openingcr: 0,
  },
  {
    id: 'bank',
    name: 'Bank',
    categoryid: 'asset',
    category: { id: 'asset', name: 'Assets' },
    openingdr: 50,
    openingcr: 0,
  },
  {
    id: 'petty-cash',
    name: 'Petty Cash',
    categoryid: 'asset',
    category: { id: 'asset', name: 'Assets' },
    openingdr: 25,
    openingcr: 0,
  },
];

const orderedLedgers: readonly Ledger[] = [ledgers[1], ledgers[0], ledgers[2]];

function sessionForOrganization(id: string): UserSession {
  return {
    name: 'Test User',
    email: 'test@example.com',
    userid: 'user-1',
    organization: {
      id,
      name: `Org ${id}`,
      email: `${id}@example.com`,
      userid: 'user-1',
      branches: [],
    },
    member: null,
    memberorgs: [],
  };
}

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    TestBed.flushEffects();
    await Promise.resolve();
  }
}

describe('LedgerStore cache', () => {
  let cacheEnabled: ReturnType<typeof signal<boolean>>;
  let session: ReturnType<typeof signal<UserSession | null>>;
  let service: LedgerServiceMock;

  function configure(options: { cacheEnabled?: boolean } = {}) {
    cacheEnabled = signal(options.cacheEnabled ?? true);
    session = signal<UserSession | null>(sessionForOrganization('org-1'));
    service = {
      count: vi.fn(async () => ledgers.length),
      create: vi.fn(),
      delete: vi.fn(async () => undefined),
      getById: vi.fn(),
      list: vi.fn(async () => ledgers),
      update: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LedgerStore,
        { provide: LedgerService, useValue: service },
        { provide: LedgerCachePreferencesStore, useValue: { enabled: cacheEnabled } },
        { provide: UserSessionStore, useValue: { session } },
      ],
    });

    return TestBed.inject(LedgerStore);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads the full catalog once and serves filtered/sorted pages from cache', async () => {
    const store = configure();

    await store.loadLedgers({
      limit: 1,
      offset: 0,
      order: ['name DESC'],
      where: { name: { ilike: '%cash%' } },
    });

    expect(service.count).toHaveBeenCalledTimes(1);
    expect(service.count).toHaveBeenCalledWith({});
    expect(service.list).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledWith({
      limit: ledgers.length,
      offset: 0,
      includes: ['category'],
    });
    expect(store.catalogLoaded()).toBe(true);
    expect(store.catalog()).toEqual(orderedLedgers);
    expect(store.count()).toBe(2);
    expect(store.items().map((ledger) => ledger.id)).toEqual(['petty-cash']);

    await store.loadLedgers({
      limit: 1,
      offset: 1,
      order: ['name DESC'],
      where: { name: { ilike: '%cash%' } },
    });

    expect(service.count).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledTimes(1);
    expect(store.items().map((ledger) => ledger.id)).toEqual(['cash']);
  });

  it('coalesces concurrent full-catalog loads', async () => {
    const catalogLoad = deferred<readonly Ledger[]>();
    const store = configure();
    service.list.mockReturnValue(catalogLoad.promise);

    const first = store.loadLedgers({ limit: 1, offset: 0 });
    const second = store.loadLedgers({ limit: 1, offset: 1 });
    await Promise.resolve();

    expect(service.count).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledTimes(1);

    catalogLoad.resolve(ledgers);
    await Promise.all([first, second]);

    expect(store.catalogLoaded()).toBe(true);
    expect(store.catalog()).toEqual(orderedLedgers);
  });

  it('reloads the full catalog on refresh', async () => {
    const store = configure();

    await store.loadLedgers({ limit: 1, offset: 0 });
    service.count.mockResolvedValueOnce(2);
    service.list.mockResolvedValueOnce(ledgers.slice(0, 2));

    await store.refreshLedgers({ limit: 10, offset: 0 });

    expect(service.count).toHaveBeenCalledTimes(2);
    expect(service.list).toHaveBeenCalledTimes(2);
    expect(store.catalog()).toEqual([ledgers[1], ledgers[0]]);
    expect(store.catalogTotalCount()).toBe(2);
  });

  it('uses a full in-memory catalog for list queries when cache is disabled', async () => {
    const store = configure({ cacheEnabled: false });
    const query = { limit: 1, offset: 0, where: { name: { ilike: '%cash%' } } };

    await store.loadLedgers(query);

    expect(service.count).toHaveBeenCalledTimes(1);
    expect(service.count).toHaveBeenCalledWith({});
    expect(service.list).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledWith({
      limit: ledgers.length,
      offset: 0,
      includes: ['category'],
    });
    expect(store.catalogLoaded()).toBe(true);
    expect(store.catalog()).toEqual(orderedLedgers);
    expect(store.items()).toEqual([ledgers[0]]);
    expect(store.count()).toBe(2);
  });

  it('allows explicit full-catalog loading when cache is disabled', async () => {
    const store = configure({ cacheEnabled: false });

    const loaded = await store.ensureLedgerCatalogLoaded();

    expect(loaded).toBe(true);
    expect(service.count).toHaveBeenCalledWith({});
    expect(service.list).toHaveBeenCalledWith({
      limit: ledgers.length,
      offset: 0,
      includes: ['category'],
    });
    expect(store.catalogLoaded()).toBe(true);
    expect(store.catalog()).toEqual(orderedLedgers);
    expect(store.items()).toEqual([]);
  });

  it('falls back to backend list/count when full-catalog loading fails', async () => {
    const store = configure();
    const query = { limit: 1, offset: 0 };
    service.count.mockRejectedValueOnce(new Error('catalog failed')).mockResolvedValueOnce(3);
    service.list.mockResolvedValueOnce(ledgers.slice(0, 1));

    await store.loadLedgers(query);

    expect(store.catalogLoaded()).toBe(false);
    expect(store.catalog()).toEqual([]);
    expect(store.items()).toEqual(ledgers.slice(0, 1));
    expect(store.count()).toBe(3);
    expect(store.error()).toBeNull();
  });

  it('clears catalog and visible state when the organization changes', async () => {
    const store = configure();

    await store.loadLedgers({ limit: 1, offset: 0 });
    store.setSelectedItem(ledgers[0]);

    session.set(sessionForOrganization('org-2'));
    await settle();

    expect(store.catalogLoaded()).toBe(false);
    expect(store.catalog()).toEqual([]);
    expect(store.items()).toEqual([]);
    expect(store.count()).toBe(0);
    expect(store.selectedItem()).toBeNull();
  });

  it('does not clear catalog when the organization id is unchanged', async () => {
    const store = configure();

    await store.loadLedgers({ limit: 1, offset: 0 });
    session.set(sessionForOrganization('org-1'));
    await settle();

    expect(store.catalogLoaded()).toBe(true);
    expect(store.catalog()).toEqual(orderedLedgers);
    expect(store.items().map((ledger) => ledger.id)).toEqual(['bank']);
  });

  it('updates cached catalog and reapplies the active query after mutations', async () => {
    const store = configure();
    const filter = { limit: 10, offset: 0, where: { name: { ilike: '%cash%' } } };

    await store.loadLedgers(filter);
    expect(store.items().map((ledger) => ledger.id)).toEqual(['cash', 'petty-cash']);

    service.create.mockResolvedValueOnce({
      id: 'sales',
      name: 'Sales',
      categoryid: 'income',
    });
    await store.createLedger({ name: 'Sales', categoryid: 'income' });

    expect(store.catalogTotalCount()).toBe(4);
    expect(store.count()).toBe(2);
    expect(store.items().map((ledger) => ledger.id)).toEqual(['cash', 'petty-cash']);

    service.update.mockResolvedValueOnce({
      id: 'petty-cash',
      name: 'Petty Bank',
      categoryid: 'asset',
    });
    await store.updateLedger('petty-cash', { name: 'Petty Bank', categoryid: 'asset' });

    expect(store.count()).toBe(1);
    expect(store.items().map((ledger) => ledger.id)).toEqual(['cash']);

    await store.deleteLedger('cash');

    expect(store.catalogTotalCount()).toBe(3);
    expect(store.count()).toBe(0);
    expect(store.items()).toEqual([]);
  });

  it('serves by-id requests from loaded catalog only when requested includes are covered', async () => {
    const store = configure();
    const backendLedger: Ledger = {
      id: 'cash',
      name: 'Cash with Entries',
      categoryid: 'asset',
    };
    service.getById.mockResolvedValue(backendLedger);

    await store.loadLedgers({ limit: 1, offset: 0 });

    const cached = await store.loadLedgerById('cash', { includes: ['category'] });
    expect(cached).toBe(ledgers[0]);
    expect(service.getById).not.toHaveBeenCalled();

    const fetched = await store.loadLedgerById('cash', { includes: ['entries'] });
    expect(fetched).toBe(backendLedger);
    expect(service.getById).toHaveBeenCalledWith('cash', { includes: ['entries'] });
  });

  it('does not mark a by-id upsert as a loaded full catalog', async () => {
    const store = configure();
    const ledger: Ledger = { id: 'cash', name: 'Cash', categoryid: 'asset' };
    service.getById.mockResolvedValueOnce(ledger);

    await store.loadLedgerById('cash');

    expect(store.catalog()).toEqual([ledger]);
    expect(store.catalogLoaded()).toBe(false);
    expect(store.catalogTotalCount()).toBe(0);
  });
});
