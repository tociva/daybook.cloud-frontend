import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type { UserSession } from '../../../management/data/user-session/user-session.model';
import type { ItemCategory } from './item-category.model';
import { ItemCategoryService } from './item-category.service';
import { ItemCategoryStore } from './item-category.store';

type ServiceMock = Readonly<{
  count: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}>;

const categories: readonly ItemCategory[] = [
  { id: 'goods', name: 'Goods', code: 'GOODS', type: 'Product' },
  {
    id: 'electronics',
    name: 'Electronics',
    code: 'ELEC',
    type: 'Product',
    parentid: 'goods',
    parent: { id: 'goods', name: 'Goods', code: 'GOODS', type: 'Product' },
    taxgroupid: 'gst',
    taxgroup: { id: 'gst', name: 'GST', rate: 18, groups: [] },
  },
  { id: 'services', name: 'Services', code: 'SERV', type: 'Service' },
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

describe('ItemCategoryStore cache', () => {
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
        ItemCategoryStore,
        { provide: ItemCategoryService, useValue: service },
        { provide: UserSessionStore, useValue: { session } },
      ],
    });

    return TestBed.inject(ItemCategoryStore);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads the full catalog once, projects queries locally, and coalesces repeated loads', async () => {
    const store = configure();

    await store.loadItemCategories({
      limit: 1,
      offset: 0,
      order: ['name ASC'],
      where: { parent: { ilike: '%goods%' } },
    });

    expect(service.count).toHaveBeenCalledWith({});
    expect(service.list).toHaveBeenCalledWith({
      limit: categories.length,
      offset: 0,
      includes: ['parent', 'taxgroup'],
    });
    expect(store.catalogLoaded()).toBe(true);
    expect(store.count()).toBe(1);
    expect(store.items().map((item) => item.id)).toEqual(['electronics']);

    await Promise.all([
      store.loadItemCategories({ limit: 1, offset: 0 }),
      store.loadItemCategories({ limit: 1, offset: 1 }),
    ]);
    expect(service.count).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledTimes(1);
  });

  it('reloads, falls back on failure, updates mutations, clears on org switch, and handles by-id cache safety', async () => {
    const store = configure();

    await store.loadItemCategories({ limit: 10, offset: 0, where: { name: { ilike: '%elect%' } } });
    service.count.mockResolvedValueOnce(2);
    service.list.mockResolvedValueOnce(categories.slice(0, 2));
    expect(await store.refreshItemCategoryCatalog()).toBe(true);
    expect(store.catalogTotalCount()).toBe(2);

    service.count.mockRejectedValueOnce(new Error('catalog failed')).mockResolvedValueOnce(3);
    service.list.mockResolvedValueOnce(categories.slice(0, 1));
    store.clearCatalog();
    await store.loadItemCategories({ limit: 1, offset: 0 });
    expect(store.catalogLoaded()).toBe(false);
    expect(store.items()).toEqual(categories.slice(0, 1));
    expect(store.count()).toBe(3);

    await store.ensureItemCategoryCatalogLoaded(true);
    await store.loadItemCategories({ limit: 10, offset: 0, where: { name: { ilike: '%elect%' } } });
    service.update.mockResolvedValueOnce({ ...categories[1], name: 'Hardware' });
    await store.updateItemCategory('electronics', {
      name: 'Hardware',
      code: 'ELEC',
      type: 'Product',
      parentid: 'goods',
      taxgroupid: 'gst',
    });
    expect(store.items()).toEqual([]);

    store.setSelectedItem(categories[0]);
    session.set(sessionForOrganization('org-2'));
    await settle();
    expect(store.catalogLoaded()).toBe(false);
    expect(store.items()).toEqual([]);
    expect(store.count()).toBe(0);
    expect(store.selectedItem()).toBeNull();

    const fetched = { id: 'electronics', name: 'Electronics with Branch', code: 'ELEC', type: 'Product' as const };
    service.getById.mockResolvedValueOnce(fetched);
    await store.ensureItemCategoryCatalogLoaded(true);
    expect(await store.loadItemCategoryById('electronics', { includes: ['parent', 'taxgroup'] })).toBe(categories[1]);
    expect(await store.loadItemCategoryById('electronics', { includes: ['branch'] })).toBe(fetched);
  });
});
