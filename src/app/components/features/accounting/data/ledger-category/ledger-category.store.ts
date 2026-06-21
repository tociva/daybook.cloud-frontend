import { computed, effect, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import { CatalogCacheService } from '../../../../../core/cache/catalog-cache.service';
import { LedgerCachePreferencesStore } from '../../../../../core/preferences/ledger-cache-preferences.store';
import {
  createCachedCrudLoader,
  findCachedEntityById,
  type Lb4Include,
  removeCachedEntityById,
  updateCachedEntityById,
  upsertCachedEntity,
} from '../../../../../shared/crud';
import type {
  LedgerCategory,
  LedgerCategoryGetQuery,
  LedgerCategoryListQuery,
  LedgerCategoryPayload,
} from './ledger-category.model';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import { sortLedgerCategoriesByAccountingOrder } from './ledger-category.ordering';
import { applyLedgerCategoryListQuery } from './ledger-category.query';
import { LedgerCategoryService } from './ledger-category.service';
import { initialLedgerCategoryState } from './ledger-category.state';

const CATALOG_INCLUDES = ['parent'] as const;
const CATALOG_INCLUDE_SET = new Set<string>(CATALOG_INCLUDES);
const CACHE_NAME = 'ledger-categories';

export const LedgerCategoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialLedgerCategoryState),
  withComputed(({ ledgerCategory }) => ({
    catalog: computed(() => ledgerCategory().catalog),
    catalogLoaded: computed(() => ledgerCategory().catalogLoaded),
    catalogTotalCount: computed(() => ledgerCategory().catalogTotalCount),
    count: computed(() => ledgerCategory().count),
    error: computed(() => ledgerCategory().error),
    isLoading: computed(() => ledgerCategory().isLoading),
    items: computed(() => ledgerCategory().items),
    selectedItem: computed(() => ledgerCategory().selectedItem),
  })),
  withMethods(
    (
      store,
      service = inject(LedgerCategoryService),
      catalogCacheStore = inject(CatalogCacheService),
      cachePrefs = inject(LedgerCachePreferencesStore),
    ) => {
      let activeViewQuery: LedgerCategoryListQuery | undefined;

      const setLoading = (): void => {
        patchState(store, (state) => ({
          ledgerCategory: { ...state.ledgerCategory, error: null, isLoading: true },
        }));
      };

      const setError = (error: string): void => {
        patchState(store, (state) => ({
          ledgerCategory: { ...state.ledgerCategory, error, isLoading: false },
        }));
      };

      const clearCatalogState = (): void => {
        catalogCache.clearPendingLoad();
        activeViewQuery = undefined;
        patchState(store, (state) => ({
          ledgerCategory: {
            ...state.ledgerCategory,
            catalog: [],
            catalogLoaded: false,
            catalogTotalCount: 0,
            count: 0,
            error: null,
            isLoading: false,
            items: [],
            selectedItem: null,
          },
        }));
      };

      const applyViewQuery = (query?: LedgerCategoryListQuery): void => {
        activeViewQuery = query;
        const { items, count } = applyLedgerCategoryListQuery(
          store.ledgerCategory().catalog,
          query,
        );
        patchState(store, (state) => ({
          ledgerCategory: { ...state.ledgerCategory, count, error: null, isLoading: false, items },
        }));
      };

      const fetchFullCatalog = async (): Promise<readonly LedgerCategory[]> => {
        const total = await service.count({});
        if (total === 0) return [];
        return service.list({ limit: total, offset: 0, includes: [...CATALOG_INCLUDES] });
      };

      const saveCatalog = (catalog: readonly LedgerCategory[]): void => {
        const orderedCatalog = sortLedgerCategoriesByAccountingOrder(catalog);
        patchState(store, (state) => ({
          ledgerCategory: {
            ...state.ledgerCategory,
            catalog: orderedCatalog,
            catalogLoaded: true,
            catalogTotalCount: orderedCatalog.length,
            error: null,
          },
        }));
      };

      const catalogCache = createCachedCrudLoader<LedgerCategory>({
        canLoadCatalog: () => catalogCacheStore.currentScope() !== null,
        clearCatalog: () => catalogCacheStore.clearCatalog(CACHE_NAME),
        fetchCatalog: fetchFullCatalog,
        isEnabled: () => cachePrefs.enabled(),
        isLoaded: () => store.ledgerCategory().catalogLoaded,
        loadCatalog: () => catalogCacheStore.loadCatalog<LedgerCategory>(CACHE_NAME),
        persistCatalog: (catalog) => catalogCacheStore.persistCatalog(CACHE_NAME, catalog),
        saveCatalog,
      });

      const readIncludeRelation = (include: Lb4Include): string | null =>
        typeof include === 'string' ? include : include.scope ? null : include.relation;

      const areIncludesCovered = (query?: LedgerCategoryGetQuery): boolean =>
        !query?.includes?.length ||
        query.includes.every((include) => {
          const relation = readIncludeRelation(include);
          return relation !== null && CATALOG_INCLUDE_SET.has(relation);
        });

      const cacheCatalogEntry = (item: LedgerCategory): void => {
        if (!cachePrefs.enabled() && !store.ledgerCategory().catalogLoaded) return;

        patchState(store, (state) => ({
          ledgerCategory: {
            ...state.ledgerCategory,
            catalog: sortLedgerCategoriesByAccountingOrder(
              upsertCachedEntity(state.ledgerCategory.catalog, item),
            ),
          },
        }));
        if (cachePrefs.enabled()) {
          void catalogCacheStore.persistCatalog(CACHE_NAME, store.ledgerCategory().catalog);
        }
      };

      const selectItem = (item: LedgerCategory | null): void => {
        patchState(store, (state) => ({
          ledgerCategory: {
            ...state.ledgerCategory,
            error: null,
            isLoading: false,
            selectedItem: item,
          },
        }));
      };

      const loadFromApi = async (query?: LedgerCategoryListQuery): Promise<void> => {
        activeViewQuery = query;
        const [items, count] = await Promise.all([service.list(query), service.count(query)]);
        patchState(store, (state) => ({
          ledgerCategory: { ...state.ledgerCategory, count, error: null, isLoading: false, items },
        }));
      };

      const ensureCatalogLoaded = async (forceReload = false): Promise<boolean> => {
        if (!cachePrefs.enabled()) return false;
        if (forceReload) clearCatalogState();
        return catalogCache.ensureLoaded();
      };

      const loadFullCatalogFromApi = async (forceReload = false): Promise<boolean> => {
        if (forceReload) clearCatalogState();
        if (store.ledgerCategory().catalogLoaded) return true;

        const catalog = await fetchFullCatalog();
        if (cachePrefs.enabled()) {
          await catalogCacheStore.persistCatalog(CACHE_NAME, catalog);
        }
        saveCatalog(catalog);
        return true;
      };

      const reapplyCachedView = (): void => applyViewQuery(activeViewQuery);

      return {
        clearCatalog(): void {
          clearCatalogState();
        },
        clearError(): void {
          patchState(store, (state) => ({
            ledgerCategory: { ...state.ledgerCategory, error: null },
          }));
        },
        clearSelectedItem(): void {
          patchState(store, (state) => ({
            ledgerCategory: { ...state.ledgerCategory, selectedItem: null },
          }));
        },
        async ensureLedgerCategoryCatalogLoaded(forceReload = false): Promise<boolean> {
          setLoading();
          try {
            const loaded = cachePrefs.enabled()
              ? await ensureCatalogLoaded(forceReload)
              : await loadFullCatalogFromApi(forceReload);
            patchState(store, (state) => ({
              ledgerCategory: { ...state.ledgerCategory, error: null, isLoading: false },
            }));
            return loaded;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load ledger categories.'));
            return false;
          }
        },
        async refreshLedgerCategoryCatalog(): Promise<boolean> {
          setLoading();
          try {
            const loaded = cachePrefs.enabled()
              ? await ensureCatalogLoaded(true)
              : await loadFullCatalogFromApi(true);
            patchState(store, (state) => ({
              ledgerCategory: { ...state.ledgerCategory, error: null, isLoading: false },
            }));
            return loaded;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load ledger categories.'));
            return false;
          }
        },
        async createLedgerCategory(payload: LedgerCategoryPayload): Promise<LedgerCategory | null> {
          setLoading();
          try {
            const item = await service.create(payload);
            if (store.ledgerCategory().catalogLoaded) {
              patchState(store, (state) => ({
                ledgerCategory: {
                  ...state.ledgerCategory,
                  catalog: sortLedgerCategoriesByAccountingOrder(
                    upsertCachedEntity(state.ledgerCategory.catalog, item),
                  ),
                  catalogTotalCount: state.ledgerCategory.catalogTotalCount + 1,
                  selectedItem: item,
                },
              }));
              reapplyCachedView();
              if (cachePrefs.enabled()) {
                void catalogCacheStore.persistCatalog(CACHE_NAME, store.ledgerCategory().catalog);
              }
            } else {
              patchState(store, (state) => ({
                ledgerCategory: {
                  ...state.ledgerCategory,
                  count: state.ledgerCategory.count + 1,
                  error: null,
                  isLoading: false,
                  items: [item, ...state.ledgerCategory.items],
                  selectedItem: item,
                },
              }));
            }
            return item;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to create ledger category.'));
            return null;
          }
        },
        async deleteLedgerCategory(id: string): Promise<boolean> {
          setLoading();
          try {
            await service.delete(id);
            if (store.ledgerCategory().catalogLoaded) {
              patchState(store, (state) => ({
                ledgerCategory: {
                  ...state.ledgerCategory,
                  catalog: removeCachedEntityById(state.ledgerCategory.catalog, id),
                  catalogTotalCount: Math.max(state.ledgerCategory.catalogTotalCount - 1, 0),
                  selectedItem:
                    state.ledgerCategory.selectedItem?.id === id
                      ? null
                      : state.ledgerCategory.selectedItem,
                },
              }));
              reapplyCachedView();
              if (cachePrefs.enabled()) {
                void catalogCacheStore.persistCatalog(CACHE_NAME, store.ledgerCategory().catalog);
              }
            } else {
              patchState(store, (state) => ({
                ledgerCategory: {
                  ...state.ledgerCategory,
                  count: Math.max(state.ledgerCategory.count - 1, 0),
                  error: null,
                  isLoading: false,
                  items: state.ledgerCategory.items.filter((item) => item.id !== id),
                  selectedItem:
                    state.ledgerCategory.selectedItem?.id === id
                      ? null
                      : state.ledgerCategory.selectedItem,
                },
              }));
            }
            return true;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to delete ledger category.'));
            return false;
          }
        },
        async loadLedgerCategoryById(
          id: string,
          query?: LedgerCategoryGetQuery,
        ): Promise<LedgerCategory | null> {
          setLoading();
          try {
            const cached = findCachedEntityById(store.ledgerCategory().catalog, id);
            if (cached && store.ledgerCategory().catalogLoaded && areIncludesCovered(query)) {
              selectItem(cached);
              return cached;
            }
            if (store.ledgerCategory().catalogLoaded && areIncludesCovered(query)) {
              selectItem(null);
              return null;
            }
            const item = await service.getById(id, query);
            cacheCatalogEntry(item);
            selectItem(item);
            return item;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load ledger category.'));
            return null;
          }
        },
        async loadLedgerCategories(query?: LedgerCategoryListQuery): Promise<void> {
          setLoading();
          try {
            const cacheReady = cachePrefs.enabled()
              ? await ensureCatalogLoaded()
              : await loadFullCatalogFromApi();
            if (cacheReady) {
              applyViewQuery(query);
              return;
            }
            await loadFromApi(query);
          } catch (error) {
            try {
              await loadFromApi(query);
              return;
            } catch {
              // Keep the original cache error.
            }
            setError(getApiErrorMessage(error, 'Failed to load ledger categories.'));
          }
        },
        async refreshLedgerCategories(query?: LedgerCategoryListQuery): Promise<void> {
          setLoading();
          try {
            const cacheReady = cachePrefs.enabled()
              ? await ensureCatalogLoaded(true)
              : await loadFullCatalogFromApi(true);
            if (cacheReady) {
              applyViewQuery(query);
              return;
            }
            await loadFromApi(query);
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load ledger categories.'));
          }
        },
        async updateLedgerCategory(id: string, payload: LedgerCategoryPayload): Promise<boolean> {
          setLoading();
          try {
            const updated = await service.update(id, payload);
            const mergeEntry = (entry: LedgerCategory): LedgerCategory =>
              entry.id === id ? { ...entry, ...payload, ...updated } : entry;
            if (store.ledgerCategory().catalogLoaded) {
              patchState(store, (state) => ({
                ledgerCategory: {
                  ...state.ledgerCategory,
                  catalog: sortLedgerCategoriesByAccountingOrder(
                    updateCachedEntityById(state.ledgerCategory.catalog, id, mergeEntry),
                  ),
                  selectedItem:
                    state.ledgerCategory.selectedItem?.id === id
                      ? mergeEntry(state.ledgerCategory.selectedItem)
                      : state.ledgerCategory.selectedItem,
                },
              }));
              reapplyCachedView();
              if (cachePrefs.enabled()) {
                void catalogCacheStore.persistCatalog(CACHE_NAME, store.ledgerCategory().catalog);
              }
            } else {
              patchState(store, (state) => ({
                ledgerCategory: {
                  ...state.ledgerCategory,
                  error: null,
                  isLoading: false,
                  items: state.ledgerCategory.items.map(mergeEntry),
                  selectedItem:
                    state.ledgerCategory.selectedItem?.id === id
                      ? mergeEntry(state.ledgerCategory.selectedItem)
                      : state.ledgerCategory.selectedItem,
                },
              }));
            }
            return true;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to update ledger category.'));
            return false;
          }
        },
      };
    },
  ),
  withHooks({
    onInit(store) {
      const cachePrefs = inject(LedgerCachePreferencesStore);
      const userSessionStore = inject(UserSessionStore);
      let previousEnabled = cachePrefs.enabled();
      let previousScope = [
        userSessionStore.session()?.organization?.id ?? null,
        userSessionStore.session()?.branch?.id ?? null,
        userSessionStore.session()?.fiscalyear?.id ?? null,
      ].join(':');

      effect(() => {
        const enabled = cachePrefs.enabled();
        if (previousEnabled && !enabled) store.clearCatalog();
        previousEnabled = enabled;
      });

      effect(() => {
        const scope = [
          userSessionStore.session()?.organization?.id ?? null,
          userSessionStore.session()?.branch?.id ?? null,
          userSessionStore.session()?.fiscalyear?.id ?? null,
        ].join(':');
        if (previousScope !== scope) store.clearCatalog();
        previousScope = scope;
      });
    },
  }),
);
