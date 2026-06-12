import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type { UserSession } from '../../../management/data/user-session/user-session.model';
import type { Vendor, VendorPayload } from './vendor.model';
import { VendorService } from './vendor.service';
import { VendorStore } from './vendor.store';

type ServiceMock = Readonly<{
  count: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}>;

const payload = (name: string, city = 'Bengaluru'): VendorPayload => ({
  name,
  countrycode: 'IN',
  currencycode: 'INR',
  state: 'Karnataka',
  address: { name, line1: 'Line 1', city },
});

const vendors: readonly Vendor[] = [
  { id: 'acme', ...payload('Acme Supplies', 'Bengaluru'), pan: 'ABCDE1234F' },
  { id: 'bravo', ...payload('Bravo Traders', 'Mumbai'), gstin: '29ABCDE1234F1Z5' },
  { id: 'cash', ...payload('Cash Vendor', 'Chennai'), mobile: '9999999999' },
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

describe('VendorStore cache', () => {
  let service: ServiceMock;
  let session: ReturnType<typeof signal<UserSession | null>>;

  function configure() {
    session = signal<UserSession | null>(sessionForOrganization('org-1'));
    service = {
      count: vi.fn(async () => vendors.length),
      create: vi.fn(),
      delete: vi.fn(async () => undefined),
      getById: vi.fn(),
      list: vi.fn(async () => vendors),
      update: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        VendorStore,
        { provide: VendorService, useValue: service },
        { provide: UserSessionStore, useValue: { session } },
      ],
    });

    return TestBed.inject(VendorStore);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads the full catalog once and serves filtered pages from cache', async () => {
    const store = configure();

    await store.loadVendors({
      limit: 1,
      offset: 0,
      order: ['name DESC'],
      where: { name: { ilike: '%vendor%' } },
    });

    expect(service.count).toHaveBeenCalledWith({});
    expect(service.list).toHaveBeenCalledWith({ limit: vendors.length, offset: 0 });
    expect(store.catalogLoaded()).toBe(true);
    expect(store.catalog()).toEqual(vendors);
    expect(store.count()).toBe(1);
    expect(store.items().map((item) => item.id)).toEqual(['cash']);

    await store.loadVendors({ limit: 1, offset: 0, where: { city: { ilike: '%ben%' } } });
    expect(service.count).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledTimes(1);
    expect(store.items().map((item) => item.id)).toEqual(['acme']);
  });

  it('reloads, falls back on failure, updates mutations, clears on org switch, and handles by-id cache safety', async () => {
    const store = configure();

    await store.loadVendors({ limit: 10, offset: 0, where: { name: { ilike: '%vendor%' } } });
    service.count.mockResolvedValueOnce(2);
    service.list.mockResolvedValueOnce(vendors.slice(0, 2));
    expect(await store.refreshVendorCatalog()).toBe(true);
    expect(store.catalogTotalCount()).toBe(2);

    service.count.mockRejectedValueOnce(new Error('catalog failed')).mockResolvedValueOnce(3);
    service.list.mockResolvedValueOnce(vendors.slice(0, 1));
    store.clearCatalog();
    await store.loadVendors({ limit: 1, offset: 0 });
    expect(store.catalogLoaded()).toBe(false);
    expect(store.items()).toEqual(vendors.slice(0, 1));
    expect(store.count()).toBe(3);

    await store.ensureVendorCatalogLoaded(true);
    await store.loadVendors({ limit: 10, offset: 0, where: { name: { ilike: '%vendor%' } } });
    service.update.mockResolvedValueOnce({ ...vendors[2], ...payload('Walk In') });
    await store.updateVendor('cash', payload('Walk In'));
    expect(store.items()).toEqual([]);

    store.setSelectedItem(vendors[0]);
    session.set(sessionForOrganization('org-2'));
    await settle();
    expect(store.catalogLoaded()).toBe(false);
    expect(store.items()).toEqual([]);
    expect(store.count()).toBe(0);
    expect(store.selectedItem()).toBeNull();

    const fetched = { id: 'acme', ...payload('Acme With Include') };
    service.getById.mockResolvedValueOnce(fetched);
    expect(await store.loadVendorById('acme')).toBe(fetched);
    expect(store.catalogLoaded()).toBe(false);
    await store.ensureVendorCatalogLoaded(true);
    expect(await store.loadVendorById('acme')).toBe(vendors[0]);
    service.getById.mockResolvedValueOnce(fetched);
    expect(await store.loadVendorById('acme', { includes: ['branch'] })).toBe(fetched);
  });
});
