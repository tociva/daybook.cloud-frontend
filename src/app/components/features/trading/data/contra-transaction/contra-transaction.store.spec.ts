import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContraTransaction, ContraTransactionPayload } from './contra-transaction.model';
import { ContraTransactionService } from './contra-transaction.service';
import { ContraTransactionStore } from './contra-transaction.store';

type ServiceMock = Readonly<{
  count: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}>;

const cash = { id: 'cash-1', name: 'Main Cash' };
const bank = { id: 'bank-1', name: 'Main Bank' };

const payload = (overrides: Partial<ContraTransactionPayload> = {}): ContraTransactionPayload => ({
  amount: 1000,
  currencycode: 'INR',
  date: '2026-05-10',
  description: 'Cash deposit to bank',
  frombcashid: 'cash-1',
  tobcashid: 'bank-1',
  ...overrides,
});

const contra = (overrides: Partial<ContraTransaction> = {}): ContraTransaction => ({
  branchid: 'branch-1',
  frombcash: cash,
  id: 'contra-1',
  tobcash: bank,
  ...payload(),
  ...overrides,
});

describe('ContraTransactionStore', () => {
  let service: ServiceMock;

  function configure() {
    service = {
      count: vi.fn(async () => 1),
      create: vi.fn(async (body: ContraTransactionPayload) =>
        contra({ id: 'created-contra', ...body }),
      ),
      delete: vi.fn(async () => undefined),
      getById: vi.fn(async (id: string) => contra({ id })),
      list: vi.fn(async () => [contra()]),
      update: vi.fn(async () => undefined),
    };

    TestBed.configureTestingModule({
      providers: [ContraTransactionStore, { provide: ContraTransactionService, useValue: service }],
    });

    return TestBed.inject(ContraTransactionStore);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('loads list and count with the active query', async () => {
    const store = configure();
    const query = {
      includes: ['frombcash', 'tobcash'],
      limit: 10,
      offset: 0,
      where: { description: { ilike: '%deposit%' } },
    };

    await store.loadContraTransactions(query);

    expect(service.list).toHaveBeenCalledWith(query);
    expect(service.count).toHaveBeenCalledWith(query);
    expect(store.items()).toEqual([contra()]);
    expect(store.count()).toBe(1);
    expect(store.error()).toBeNull();
    expect(store.isLoading()).toBe(false);
  });

  it('creates a transaction and selects the created item', async () => {
    const store = configure();
    const body = payload({ amount: 1500 });

    const created = await store.createContraTransaction(body);

    expect(service.create).toHaveBeenCalledWith(body);
    expect(created).toEqual(contra({ id: 'created-contra', ...body }));
    expect(store.items()[0]).toEqual(created);
    expect(store.selectedItem()).toEqual(created);
    expect(store.count()).toBe(1);
  });

  it('loads a transaction by id with includes', async () => {
    const store = configure();
    const query = { includes: ['frombcash', 'tobcash'] };

    const item = await store.loadContraTransactionById('contra-2', query);

    expect(service.getById).toHaveBeenCalledWith('contra-2', query);
    expect(item).toEqual(contra({ id: 'contra-2' }));
    expect(store.selectedItem()).toEqual(item);
  });

  it('merges submitted update payload after a 204 response', async () => {
    const store = configure();
    await store.loadContraTransactions();
    store.setSelectedItem(contra());

    const body = payload({
      amount: 2500,
      description: 'Moved to reserve bank',
      frombcashid: 'cash-2',
      tobcashid: 'bank-1',
    });
    const result = await store.updateContraTransaction('contra-1', body);

    expect(result).toBe(true);
    expect(service.update).toHaveBeenCalledWith('contra-1', body);
    expect(store.items()[0]).toMatchObject({
      amount: 2500,
      description: 'Moved to reserve bank',
      frombcashid: 'cash-2',
      id: 'contra-1',
      tobcashid: 'bank-1',
    });
    expect(store.items()[0].frombcash).toBeUndefined();
    expect(store.items()[0].tobcash).toEqual(bank);
    expect(store.selectedItem()).toMatchObject({ amount: 2500, frombcashid: 'cash-2' });
  });

  it('deletes a transaction and clears selection', async () => {
    const store = configure();
    await store.loadContraTransactions();
    store.setSelectedItem(contra());

    const result = await store.deleteContraTransaction('contra-1');

    expect(result).toBe(true);
    expect(service.delete).toHaveBeenCalledWith('contra-1');
    expect(store.items()).toEqual([]);
    expect(store.count()).toBe(0);
    expect(store.selectedItem()).toBeNull();
  });

  it('sets error state when service calls fail', async () => {
    const store = configure();

    service.create.mockRejectedValueOnce(new Error('create failed'));
    expect(await store.createContraTransaction(payload())).toBeNull();
    expect(store.error()).toBe('create failed');
    expect(store.isLoading()).toBe(false);

    service.list.mockRejectedValueOnce(new Error('list failed'));
    await store.loadContraTransactions();
    expect(store.error()).toBe('list failed');
    expect(store.isLoading()).toBe(false);

    service.getById.mockRejectedValueOnce(new Error('get failed'));
    expect(await store.loadContraTransactionById('missing')).toBeNull();
    expect(store.error()).toBe('get failed');

    service.update.mockRejectedValueOnce(new Error('update failed'));
    expect(await store.updateContraTransaction('contra-1', payload())).toBe(false);
    expect(store.error()).toBe('update failed');

    service.delete.mockRejectedValueOnce(new Error('delete failed'));
    expect(await store.deleteContraTransaction('contra-1')).toBe(false);
    expect(store.error()).toBe('delete failed');
  });
});
