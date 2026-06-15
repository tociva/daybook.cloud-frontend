import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type { UserSession } from '../../../management/data/user-session/user-session.model';
import type { LedgerCategory } from './ledger-category.model';
import { LedgerCategoryService } from './ledger-category.service';
import { LedgerCategoryStore } from './ledger-category.store';

type ServiceMock = Readonly<{
  count: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}>;

const categories: readonly LedgerCategory[] = [
  { id: 'assets', name: 'Assets', props: { type: 'Asset' } },
  {
    id: 'cash',
    name: 'Cash',
    parentid: 'assets',
    parent: { id: 'assets', name: 'Assets' },
    props: { type: 'Asset' },
  },
  { id: 'income', name: 'Income', props: { type: 'Income' } },
];

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

describe('LedgerCategoryStore cache', () => {
  let service: ServiceMock;
  let session: ReturnType<typeof signal<UserSession | null>>;

  function configure() {
    session = signal<UserSession | null>(sessionForOrganization('org-1'));
    service = {
      count: vi.fn(async () => categories.length),
      create: vi.fn(),
      delete: vi.fn(async () => undefined),
      getById: vi.fn(),
      list: vi.fn(async () => categories),
      update: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LedgerCategoryStore,
        { provide: LedgerCategoryService, useValue: service },
        { provide: UserSessionStore, useValue: { session } },
      ],
    });

    return TestBed.inject(LedgerCategoryStore);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads the full catalog once and serves filtered pages from cache', async () => {
    const store = configure();

    await store.loadLedgerCategories({
      limit: 1,
      offset: 0,
      order: ['name DESC'],
      where: { parent: { ilike: '%assets%' } },
    });

    expect(service.count).toHaveBeenCalledWith({});
    expect(service.list).toHaveBeenCalledWith({
      limit: categories.length,
      offset: 0,
      includes: ['parent'],
    });
    expect(store.catalogLoaded()).toBe(true);
    expect(store.catalog()).toEqual(categories);
    expect(store.count()).toBe(1);
    expect(store.items().map((item) => item.id)).toEqual(['cash']);

    await store.loadLedgerCategories({ limit: 1, offset: 1, where: { parent: { ilike: '%assets%' } } });
    expect(service.count).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent full-catalog loads', async () => {
    const store = configure();
    await Promise.all([
      store.loadLedgerCategories({ limit: 1, offset: 0 }),
      store.loadLedgerCategories({ limit: 1, offset: 1 }),
    ]);

    expect(service.count).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledTimes(1);
  });

  it('reloads the full catalog on refresh', async () => {
    const store = configure();

    await store.loadLedgerCategories({ limit: 1, offset: 0 });
    service.count.mockResolvedValueOnce(2);
    service.list.mockResolvedValueOnce(categories.slice(0, 2));

    await store.refreshLedgerCategories({ limit: 10, offset: 0 });

    expect(service.count).toHaveBeenCalledTimes(2);
    expect(service.list).toHaveBeenCalledTimes(2);
    expect(store.catalog()).toEqual(categories.slice(0, 2));
    expect(store.catalogTotalCount()).toBe(2);
    expect(store.items()).toEqual(categories.slice(0, 2));
    expect(store.count()).toBe(2);
  });

  it('reloads, falls back on failure, updates mutations, clears on org switch, and handles by-id cache safety', async () => {
    const store = configure();

    await store.loadLedgerCategories({ limit: 10, offset: 0, where: { name: { ilike: '%cash%' } } });
    service.count.mockResolvedValueOnce(2);
    service.list.mockResolvedValueOnce(categories.slice(0, 2));
    expect(await store.ensureLedgerCategoryCatalogLoaded(true)).toBe(true);
    expect(store.catalogTotalCount()).toBe(2);

    service.count.mockRejectedValueOnce(new Error('catalog failed')).mockResolvedValueOnce(3);
    service.list.mockResolvedValueOnce(categories.slice(0, 1));
    store.clearCatalog();
    await store.loadLedgerCategories({ limit: 1, offset: 0 });
    expect(store.catalogLoaded()).toBe(false);
    expect(store.items()).toEqual(categories.slice(0, 1));
    expect(store.count()).toBe(3);

    await store.ensureLedgerCategoryCatalogLoaded(true);
    await store.loadLedgerCategories({ limit: 10, offset: 0, where: { name: { ilike: '%cash%' } } });
    service.update.mockResolvedValueOnce({ ...categories[1], name: 'Petty' });
    await store.updateLedgerCategory('cash', { name: 'Petty', parentid: 'assets' });
    expect(store.items()).toEqual([]);

    await store.ensureLedgerCategoryCatalogLoaded(true);
    await store.loadLedgerCategoryById('assets', { includes: ['parent'] });
    expect(store.selectedItem()).toBe(categories[0]);
    session.set(sessionForOrganization('org-2'));
    await settle();
    expect(store.catalogLoaded()).toBe(false);
    expect(store.items()).toEqual([]);
    expect(store.count()).toBe(0);
    expect(store.selectedItem()).toBeNull();

    const fetched = { id: 'cash', name: 'Cash with Branch' };
    service.getById.mockResolvedValueOnce(fetched);
    await store.ensureLedgerCategoryCatalogLoaded(true);
    expect(await store.loadLedgerCategoryById('cash', { includes: ['parent'] })).toBe(categories[1]);
    expect(await store.loadLedgerCategoryById('cash', { includes: ['branch'] })).toBe(fetched);
  });
});
