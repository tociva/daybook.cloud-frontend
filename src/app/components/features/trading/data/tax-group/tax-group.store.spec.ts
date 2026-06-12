import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type { UserSession } from '../../../management/data/user-session/user-session.model';
import type { TaxGroup } from './tax-group.model';
import { TaxGroupService } from './tax-group.service';
import { TaxGroupStore } from './tax-group.store';

type ServiceMock = Readonly<{
  count: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}>;

const taxGroups: readonly TaxGroup[] = [
  { id: 'gst-18', name: 'GST 18', rate: 18, groups: [{ mode: 'Intra State', taxids: ['cgst', 'sgst'] }] },
  { id: 'igst-18', name: 'IGST 18', rate: 18, groups: [{ mode: 'Inter State', taxids: ['igst'] }] },
  { id: 'zero', name: 'Zero Rated', rate: 0, groups: [{ mode: 'Export', taxids: [] }] },
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

describe('TaxGroupStore cache', () => {
  let service: ServiceMock;
  let session: ReturnType<typeof signal<UserSession | null>>;

  function configure() {
    session = signal<UserSession | null>(sessionForOrganization('org-1'));
    service = {
      count: vi.fn(async () => taxGroups.length),
      create: vi.fn(),
      delete: vi.fn(async () => undefined),
      getById: vi.fn(),
      list: vi.fn(async () => taxGroups),
      update: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TaxGroupStore,
        { provide: TaxGroupService, useValue: service },
        { provide: UserSessionStore, useValue: { session } },
      ],
    });

    return TestBed.inject(TaxGroupStore);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads the full catalog once and serves filtered pages from cache', async () => {
    const store = configure();

    await store.loadTaxGroups({
      limit: 1,
      offset: 0,
      order: ['name DESC'],
      where: { name: { ilike: '%18%' } },
    });

    expect(service.count).toHaveBeenCalledWith({});
    expect(service.list).toHaveBeenCalledWith({ limit: taxGroups.length, offset: 0 });
    expect(store.catalogLoaded()).toBe(true);
    expect(store.count()).toBe(2);
    expect(store.items().map((item) => item.id)).toEqual(['igst-18']);

    await store.loadTaxGroups({ limit: 1, offset: 1 });
    expect(service.count).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledTimes(1);
  });

  it('reloads, falls back on failure, updates mutations, clears on org switch, and handles by-id cache reads', async () => {
    const store = configure();

    await store.loadTaxGroups({ limit: 10, offset: 0, where: { name: { ilike: '%18%' } } });
    service.count.mockResolvedValueOnce(2);
    service.list.mockResolvedValueOnce(taxGroups.slice(0, 2));
    expect(await store.refreshTaxGroupCatalog()).toBe(true);
    expect(store.catalogTotalCount()).toBe(2);

    service.count.mockRejectedValueOnce(new Error('catalog failed')).mockResolvedValueOnce(3);
    service.list.mockResolvedValueOnce(taxGroups.slice(0, 1));
    store.clearCatalog();
    await store.loadTaxGroups({ limit: 1, offset: 0 });
    expect(store.catalogLoaded()).toBe(false);
    expect(store.items()).toEqual(taxGroups.slice(0, 1));
    expect(store.count()).toBe(3);

    await store.ensureTaxGroupCatalogLoaded(true);
    await store.loadTaxGroups({ limit: 10, offset: 0, where: { name: { ilike: '%18%' } } });
    service.update.mockResolvedValueOnce({ ...taxGroups[1], name: 'Inter State GST' });
    await store.updateTaxGroup('igst-18', {
      name: 'Inter State GST',
      rate: 18,
      groups: [{ mode: 'Inter State', taxids: ['igst'] }],
    });
    expect(store.items().map((item) => item.id)).toEqual(['gst-18']);
    expect(store.getAvailableModes()).toContain('Intra State');

    store.setSelectedItem(taxGroups[0]);
    session.set(sessionForOrganization('org-2'));
    await settle();
    expect(store.catalogLoaded()).toBe(false);
    expect(store.items()).toEqual([]);
    expect(store.count()).toBe(0);
    expect(store.selectedItem()).toBeNull();

    const fetched = { ...taxGroups[0], name: 'GST fresh' };
    service.getById.mockResolvedValueOnce(fetched);
    expect(await store.loadTaxGroupById('gst-18')).toBe(fetched);
    expect(store.catalogLoaded()).toBe(false);
    await store.ensureTaxGroupCatalogLoaded(true);
    expect(await store.loadTaxGroupById('gst-18')).toBe(taxGroups[0]);
  });
});
