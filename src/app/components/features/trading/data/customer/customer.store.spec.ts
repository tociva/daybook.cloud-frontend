import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type { UserSession } from '../../../management/data/user-session/user-session.model';
import type { Customer, CustomerPayload } from './customer.model';
import { CustomerService } from './customer.service';
import { CustomerStore } from './customer.store';

type ServiceMock = Readonly<{
  count: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}>;

const payload = (name: string, city = 'Bengaluru'): CustomerPayload => ({
  name,
  countrycode: 'IN',
  currencycode: 'INR',
  state: 'Karnataka',
  address: { name, line1: 'Line 1', city },
});

const customers: readonly Customer[] = [
  { id: 'acme', ...payload('Acme Retail', 'Bengaluru'), email: 'billing@acme.example' },
  { id: 'bravo', ...payload('Bravo Stores', 'Mumbai'), email: 'accounts@bravo.example' },
  { id: 'cash', ...payload('Cash Customer', 'Chennai'), mobile: '9999999999' },
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

describe('CustomerStore cache', () => {
  let service: ServiceMock;
  let session: ReturnType<typeof signal<UserSession | null>>;

  function configure() {
    session = signal<UserSession | null>(sessionForOrganization('org-1'));
    service = {
      count: vi.fn(async () => customers.length),
      create: vi.fn(),
      delete: vi.fn(async () => undefined),
      getById: vi.fn(),
      list: vi.fn(async () => customers),
      update: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CustomerStore,
        { provide: CustomerService, useValue: service },
        { provide: UserSessionStore, useValue: { session } },
      ],
    });

    return TestBed.inject(CustomerStore);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads the full catalog once and serves filtered pages from cache', async () => {
    const store = configure();

    await store.loadCustomers({
      limit: 1,
      offset: 0,
      order: ['name DESC'],
      where: { name: { ilike: '%customer%' } },
    });

    expect(service.count).toHaveBeenCalledWith({});
    expect(service.list).toHaveBeenCalledWith({ limit: customers.length, offset: 0 });
    expect(store.catalogLoaded()).toBe(true);
    expect(store.catalog()).toEqual(customers);
    expect(store.count()).toBe(1);
    expect(store.items().map((item) => item.id)).toEqual(['cash']);

    await store.loadCustomers({ limit: 1, offset: 0, where: { city: { ilike: '%ben%' } } });
    expect(service.count).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledTimes(1);
    expect(store.items().map((item) => item.id)).toEqual(['acme']);
  });

  it('reloads, falls back on failure, updates mutations, clears on org switch, and handles by-id cache safety', async () => {
    const store = configure();

    await store.loadCustomers({ limit: 10, offset: 0, where: { name: { ilike: '%customer%' } } });
    service.count.mockResolvedValueOnce(2);
    service.list.mockResolvedValueOnce(customers.slice(0, 2));
    expect(await store.refreshCustomerCatalog()).toBe(true);
    expect(store.catalogTotalCount()).toBe(2);

    service.count.mockRejectedValueOnce(new Error('catalog failed')).mockResolvedValueOnce(3);
    service.list.mockResolvedValueOnce(customers.slice(0, 1));
    store.clearCatalog();
    await store.loadCustomers({ limit: 1, offset: 0 });
    expect(store.catalogLoaded()).toBe(false);
    expect(store.items()).toEqual(customers.slice(0, 1));
    expect(store.count()).toBe(3);

    await store.ensureCustomerCatalogLoaded(true);
    await store.loadCustomers({ limit: 10, offset: 0, where: { name: { ilike: '%customer%' } } });
    service.update.mockResolvedValueOnce({ ...customers[2], ...payload('Walk In') });
    await store.updateCustomer('cash', payload('Walk In'));
    expect(store.items()).toEqual([]);

    store.setSelectedItem(customers[0]);
    session.set(sessionForOrganization('org-2'));
    await settle();
    expect(store.catalogLoaded()).toBe(false);
    expect(store.items()).toEqual([]);
    expect(store.count()).toBe(0);
    expect(store.selectedItem()).toBeNull();

    const fetched = { id: 'acme', ...payload('Acme With Include') };
    service.getById.mockResolvedValueOnce(fetched);
    expect(await store.loadCustomerById('acme')).toBe(fetched);
    expect(store.catalogLoaded()).toBe(false);
    await store.ensureCustomerCatalogLoaded(true);
    expect(await store.loadCustomerById('acme')).toBe(customers[0]);
    service.getById.mockResolvedValueOnce(fetched);
    expect(await store.loadCustomerById('acme', { includes: ['branch'] })).toBe(fetched);
  });
});
