import { describe, expect, it, vi } from 'vitest';
import {
  applyCachedCrudListQuery,
  createCachedCrudLoader,
  removeCachedEntityById,
  updateCachedEntityById,
  upsertCachedEntity,
} from './cached-crud';

type TestEntity = Readonly<{
  amount: number;
  category?: Readonly<{ name: string }>;
  id?: string;
  name: string;
  status: number;
}>;

const catalog: readonly TestEntity[] = [
  { amount: 100, category: { name: 'Asset' }, id: '1', name: 'Cash', status: 1 },
  { amount: 200, category: { name: 'Income' }, id: '2', name: 'Sales', status: 1 },
  { amount: 50, category: { name: 'Asset' }, id: '3', name: 'Bank Cash', status: 0 },
];

function readFieldValue(entity: TestEntity, field: string): unknown {
  return field === 'category'
    ? (entity.category?.name ?? '')
    : (entity as Record<string, unknown>)[field];
}

describe('cached CRUD helpers', () => {
  it('filters, sorts, pages, and counts cached rows', () => {
    const result = applyCachedCrudListQuery(
      catalog,
      {
        limit: 1,
        offset: 0,
        order: ['amount DESC'],
        where: {
          or: [{ name: { ilike: '%cash%' } }, { category: { ilike: 'asset' } }],
        },
      },
      { readFieldValue },
    );

    expect(result.count).toBe(2);
    expect(result.items.map((item) => item.id)).toEqual(['1']);
  });

  it('updates cached entities without marking catalog completeness', () => {
    const upserted = upsertCachedEntity(catalog, {
      amount: 125,
      id: '1',
      name: 'Petty Cash',
      status: 1,
    });
    const updated = updateCachedEntityById(upserted, '2', (entry) => ({
      ...entry,
      status: 0,
    }));
    const removed = removeCachedEntityById(updated, '3');

    expect(upserted.find((item) => item.id === '1')?.name).toBe('Petty Cash');
    expect(updated.find((item) => item.id === '2')?.status).toBe(0);
    expect(removed.map((item) => item.id)).toEqual(['1', '2']);
  });

  it('coalesces concurrent catalog loads', async () => {
    let loaded = false;
    let saved: readonly TestEntity[] = [];
    const fetchCatalog = vi.fn(async () => catalog);
    const loader = createCachedCrudLoader<TestEntity>({
      fetchCatalog,
      isEnabled: () => true,
      isLoaded: () => loaded,
      saveCatalog: (items) => {
        saved = items;
        loaded = true;
      },
    });

    const results = await Promise.all([loader.ensureLoaded(), loader.ensureLoaded()]);

    expect(results).toEqual([true, true]);
    expect(fetchCatalog).toHaveBeenCalledTimes(1);
    expect(saved).toEqual(catalog);
  });

  it('hydrates from persisted catalog before fetching from the backend', async () => {
    let loaded = false;
    let saved: readonly TestEntity[] = [];
    const persisted = catalog.slice(0, 1);
    const fetchCatalog = vi.fn(async () => catalog);
    const loadCatalog = vi.fn(async () => persisted);
    const persistCatalog = vi.fn(async () => undefined);
    const loader = createCachedCrudLoader<TestEntity>({
      fetchCatalog,
      isEnabled: () => true,
      isLoaded: () => loaded,
      loadCatalog,
      persistCatalog,
      saveCatalog: (items) => {
        saved = items;
        loaded = true;
      },
    });

    await expect(loader.ensureLoaded()).resolves.toBe(true);

    expect(loadCatalog).toHaveBeenCalledTimes(1);
    expect(fetchCatalog).not.toHaveBeenCalled();
    expect(persistCatalog).not.toHaveBeenCalled();
    expect(saved).toEqual(persisted);
  });

  it('persists backend catalog when no persisted catalog is available', async () => {
    let loaded = false;
    const persistCatalog = vi.fn(async () => undefined);
    const loader = createCachedCrudLoader<TestEntity>({
      fetchCatalog: vi.fn(async () => catalog),
      isEnabled: () => true,
      isLoaded: () => loaded,
      loadCatalog: vi.fn(async () => null),
      persistCatalog,
      saveCatalog: () => {
        loaded = true;
      },
    });

    await expect(loader.ensureLoaded()).resolves.toBe(true);

    expect(persistCatalog).toHaveBeenCalledWith(catalog);
  });

  it('clears persisted catalog when pending loads are cleared', () => {
    const clearCatalog = vi.fn(async () => undefined);
    const loader = createCachedCrudLoader<TestEntity>({
      clearCatalog,
      fetchCatalog: vi.fn(async () => catalog),
      isEnabled: () => true,
      isLoaded: () => false,
      saveCatalog: () => undefined,
    });

    loader.clearPendingLoad();

    expect(clearCatalog).toHaveBeenCalledTimes(1);
  });

  it('ignores in-flight catalog loads after they are cleared', async () => {
    let loaded = false;
    let resolveCatalog: (items: readonly TestEntity[]) => void = () => undefined;
    let saved: readonly TestEntity[] = [];
    const fetchCatalog = vi.fn(
      () =>
        new Promise<readonly TestEntity[]>((resolve) => {
          resolveCatalog = resolve;
        }),
    );
    const loader = createCachedCrudLoader<TestEntity>({
      fetchCatalog,
      isEnabled: () => true,
      isLoaded: () => loaded,
      saveCatalog: (items) => {
        saved = items;
        loaded = true;
      },
    });

    const result = loader.ensureLoaded();
    loader.clearPendingLoad();
    resolveCatalog(catalog);

    await expect(result).resolves.toBe(false);
    expect(saved).toEqual([]);
    expect(loaded).toBe(false);
  });
});
