import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type { UserSession } from '../../../management/data/user-session/user-session.model';
import type { Item } from './item.model';
import { ItemService } from './item.service';
import { ItemStore } from './item.store';

type ItemServiceMock = Readonly<{
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

const items: readonly Item[] = [
  {
    id: 'laptop',
    name: 'Laptop',
    code: 'LAP-001',
    displayname: 'Laptop',
    categoryid: 'electronics',
    category: { id: 'electronics', name: 'Electronics', code: 'ELEC', type: 'Product' },
    barcode: '890000000001',
    description: 'Business laptop',
  },
  {
    id: 'mouse',
    name: 'Mouse',
    code: 'MOU-001',
    displayname: 'Mouse',
    categoryid: 'electronics',
    category: { id: 'electronics', name: 'Electronics', code: 'ELEC', type: 'Product' },
    barcode: '890000000002',
    description: 'Wireless mouse',
  },
  {
    id: 'consulting',
    name: 'Consulting',
    code: 'CON-001',
    displayname: 'Consulting Service',
    categoryid: 'services',
    category: { id: 'services', name: 'Services', code: 'SERV', type: 'Service' },
    description: 'Implementation consulting',
  },
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

describe('ItemStore cache', () => {
  let service: ItemServiceMock;
  let session: ReturnType<typeof signal<UserSession | null>>;

  function configure() {
    session = signal<UserSession | null>(sessionForOrganization('org-1'));
    service = {
      count: vi.fn(async () => items.length),
      create: vi.fn(),
      delete: vi.fn(async () => undefined),
      getById: vi.fn(),
      list: vi.fn(async () => items),
      update: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ItemStore,
        { provide: ItemService, useValue: service },
        { provide: UserSessionStore, useValue: { session } },
      ],
    });

    return TestBed.inject(ItemStore);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads the full catalog once and serves filtered/sorted pages from cache', async () => {
    const store = configure();

    await store.loadItems({
      limit: 1,
      offset: 0,
      order: ['name DESC'],
      where: { name: { ilike: '%o%' } },
    });

    expect(service.count).toHaveBeenCalledTimes(1);
    expect(service.count).toHaveBeenCalledWith({});
    expect(service.list).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledWith({
      limit: items.length,
      offset: 0,
      includes: ['category'],
    });
    expect(store.catalogLoaded()).toBe(true);
    expect(store.catalog()).toEqual(items);
    expect(store.count()).toBe(3);
    expect(store.items().map((item) => item.id)).toEqual(['mouse']);

    await store.loadItems({
      limit: 1,
      offset: 1,
      order: ['name DESC'],
      where: { name: { ilike: '%o%' } },
    });

    expect(service.count).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledTimes(1);
    expect(store.items().map((item) => item.id)).toEqual(['laptop']);
  });

  it('coalesces concurrent full-catalog loads', async () => {
    const catalogLoad = deferred<readonly Item[]>();
    const store = configure();
    service.list.mockReturnValue(catalogLoad.promise);

    const first = store.loadItems({ limit: 1, offset: 0 });
    const second = store.loadItems({ limit: 1, offset: 1 });
    await Promise.resolve();

    expect(service.count).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledTimes(1);

    catalogLoad.resolve(items);
    await Promise.all([first, second]);

    expect(store.catalogLoaded()).toBe(true);
    expect(store.catalog()).toEqual(items);
  });

  it('reloads the full catalog on forced ensure', async () => {
    const store = configure();

    await store.loadItems({ limit: 1, offset: 0 });
    service.count.mockResolvedValueOnce(2);
    service.list.mockResolvedValueOnce(items.slice(0, 2));

    const loaded = await store.ensureItemCatalogLoaded(true);

    expect(loaded).toBe(true);
    expect(service.count).toHaveBeenCalledTimes(2);
    expect(service.list).toHaveBeenCalledTimes(2);
    expect(store.catalog()).toEqual(items.slice(0, 2));
    expect(store.catalogTotalCount()).toBe(2);
  });

  it('falls back to backend list/count when full-catalog loading fails', async () => {
    const store = configure();
    const query = { limit: 1, offset: 0 };
    service.count.mockRejectedValueOnce(new Error('catalog failed')).mockResolvedValueOnce(3);
    service.list.mockResolvedValueOnce(items.slice(0, 1));

    await store.loadItems(query);

    expect(store.catalogLoaded()).toBe(false);
    expect(store.catalog()).toEqual([]);
    expect(store.items()).toEqual(items.slice(0, 1));
    expect(store.count()).toBe(3);
    expect(store.error()).toBeNull();
  });

  it('updates cached catalog and reapplies the active query after mutations', async () => {
    const store = configure();
    const filter = { limit: 10, offset: 0, where: { name: { ilike: '%o%' } } };

    await store.loadItems(filter);
    expect(store.items().map((item) => item.id)).toEqual(['laptop', 'mouse', 'consulting']);

    service.create.mockResolvedValueOnce({
      id: 'keyboard',
      name: 'Keyboard',
      code: 'KEY-001',
      displayname: 'Keyboard',
      categoryid: 'electronics',
    });
    await store.createItem({
      name: 'Keyboard',
      code: 'KEY-001',
      displayname: 'Keyboard',
      categoryid: 'electronics',
    });

    expect(store.catalogTotalCount()).toBe(4);
    expect(store.count()).toBe(4);
    expect(store.items().map((item) => item.id)).toEqual([
      'keyboard',
      'laptop',
      'mouse',
      'consulting',
    ]);

    service.update.mockResolvedValueOnce({
      id: 'mouse',
      name: 'Trackpad',
      code: 'MOU-001',
      displayname: 'Trackpad',
      categoryid: 'electronics',
    });
    await store.updateItem('mouse', {
      name: 'Trackpad',
      code: 'MOU-001',
      displayname: 'Trackpad',
      categoryid: 'electronics',
    });

    expect(store.count()).toBe(3);
    expect(store.items().map((item) => item.id)).toEqual(['keyboard', 'laptop', 'consulting']);

    await store.deleteItem('laptop');

    expect(store.catalogTotalCount()).toBe(3);
    expect(store.count()).toBe(2);
    expect(store.items().map((item) => item.id)).toEqual(['keyboard', 'consulting']);
  });

  it('clears catalog and visible state when the organization changes while preserving drafts', async () => {
    const store = configure();

    await store.loadItems({ limit: 1, offset: 0 });
    store.setSelectedItem(items[0]);
    store.setCreateDraft(items[1]);

    session.set(sessionForOrganization('org-2'));
    await settle();

    expect(store.catalogLoaded()).toBe(false);
    expect(store.catalog()).toEqual([]);
    expect(store.items()).toEqual([]);
    expect(store.count()).toBe(0);
    expect(store.selectedItem()).toBeNull();
    expect(store.createDraft()).toBe(items[1]);
  });

  it('does not clear catalog when the organization id is unchanged', async () => {
    const store = configure();

    await store.loadItems({ limit: 1, offset: 0 });
    session.set(sessionForOrganization('org-1'));
    await settle();

    expect(store.catalogLoaded()).toBe(true);
    expect(store.catalog()).toEqual(items);
    expect(store.items().map((item) => item.id)).toEqual(['laptop']);
  });

  it('serves by-id requests from loaded catalog only when requested includes are covered', async () => {
    const store = configure();
    const backendItem: Item = {
      id: 'laptop',
      name: 'Laptop with Branch',
      code: 'LAP-001',
      displayname: 'Laptop with Branch',
      categoryid: 'electronics',
    };
    service.getById.mockResolvedValue(backendItem);

    await store.loadItems({ limit: 1, offset: 0 });

    const cached = await store.loadItemById('laptop', { includes: ['category'] });
    expect(cached).toBe(items[0]);
    expect(service.getById).not.toHaveBeenCalled();

    const fetched = await store.loadItemById('laptop', { includes: ['branch'] });
    expect(fetched).toBe(backendItem);
    expect(service.getById).toHaveBeenCalledWith('laptop', { includes: ['branch'] });
  });

  it('does not mark a by-id upsert as a loaded full catalog', async () => {
    const store = configure();
    const item: Item = {
      id: 'laptop',
      name: 'Laptop',
      code: 'LAP-001',
      displayname: 'Laptop',
      categoryid: 'electronics',
    };
    service.getById.mockResolvedValueOnce(item);

    await store.loadItemById('laptop');

    expect(store.catalog()).toEqual([item]);
    expect(store.catalogLoaded()).toBe(false);
    expect(store.catalogTotalCount()).toBe(0);
  });
});
