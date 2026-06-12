import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type { UserSession } from '../../../management/data/user-session/user-session.model';
import type { Tax } from './tax.model';
import { TaxService } from './tax.service';
import { TaxStore } from './tax.store';

type ServiceMock = Readonly<{
  count: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}>;

const taxes: readonly Tax[] = [
  { id: 'cgst', name: 'CGST', shortname: 'CGST', rate: 9, appliedto: 100, status: 1 },
  { id: 'sgst', name: 'SGST', shortname: 'SGST', rate: 9, appliedto: 100, status: 1 },
  { id: 'igst', name: 'IGST', shortname: 'IGST', rate: 18, appliedto: 100, status: 1 },
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

describe('TaxStore cache', () => {
  let service: ServiceMock;
  let session: ReturnType<typeof signal<UserSession | null>>;

  function configure() {
    session = signal<UserSession | null>(sessionForOrganization('org-1'));
    service = {
      count: vi.fn(async () => taxes.length),
      create: vi.fn(),
      delete: vi.fn(async () => undefined),
      getById: vi.fn(),
      list: vi.fn(async () => taxes),
      update: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TaxStore,
        { provide: TaxService, useValue: service },
        { provide: UserSessionStore, useValue: { session } },
      ],
    });

    return TestBed.inject(TaxStore);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads the full catalog once and serves filtered pages from cache', async () => {
    const store = configure();

    await store.loadTaxes({
      limit: 1,
      offset: 0,
      order: ['rate DESC'],
      where: { name: { ilike: '%gst%' } },
    });

    expect(service.count).toHaveBeenCalledWith({});
    expect(service.list).toHaveBeenCalledWith({ limit: taxes.length, offset: 0 });
    expect(store.catalogLoaded()).toBe(true);
    expect(store.count()).toBe(3);
    expect(store.items().map((item) => item.id)).toEqual(['igst']);

    await store.loadTaxes({ limit: 1, offset: 1 });
    expect(service.count).toHaveBeenCalledTimes(1);
    expect(service.list).toHaveBeenCalledTimes(1);
  });

  it('reloads, falls back on failure, updates mutations, clears on org switch, and handles by-id cache reads', async () => {
    const store = configure();

    await store.loadTaxes({ limit: 10, offset: 0, where: { name: { ilike: '%gst%' } } });
    service.count.mockResolvedValueOnce(2);
    service.list.mockResolvedValueOnce(taxes.slice(0, 2));
    expect(await store.refreshTaxCatalog()).toBe(true);
    expect(store.catalogTotalCount()).toBe(2);

    service.count.mockRejectedValueOnce(new Error('catalog failed')).mockResolvedValueOnce(3);
    service.list.mockResolvedValueOnce(taxes.slice(0, 1));
    store.clearCatalog();
    await store.loadTaxes({ limit: 1, offset: 0 });
    expect(store.catalogLoaded()).toBe(false);
    expect(store.items()).toEqual(taxes.slice(0, 1));
    expect(store.count()).toBe(3);

    await store.ensureTaxCatalogLoaded(true);
    await store.loadTaxes({ limit: 10, offset: 0, where: { name: { ilike: '%gst%' } } });
    service.update.mockResolvedValueOnce({ ...taxes[2], name: 'Value Added Tax' });
    await store.updateTax('igst', {
      name: 'Value Added Tax',
      shortname: 'VAT',
      rate: 18,
      appliedto: 100,
      status: 1,
    });
    expect(store.items().map((item) => item.id)).toEqual(['cgst', 'sgst']);

    store.setSelectedItem(taxes[0]);
    session.set(sessionForOrganization('org-2'));
    await settle();
    expect(store.catalogLoaded()).toBe(false);
    expect(store.items()).toEqual([]);
    expect(store.count()).toBe(0);
    expect(store.selectedItem()).toBeNull();

    const fetched = { ...taxes[0], name: 'CGST fresh' };
    service.getById.mockResolvedValueOnce(fetched);
    expect(await store.loadTaxById('cgst')).toBe(fetched);
    expect(store.catalogLoaded()).toBe(false);
    await store.ensureTaxCatalogLoaded(true);
    expect(await store.loadTaxById('cgst')).toBe(taxes[0]);
  });
});
