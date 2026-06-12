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
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type { Ledger, LedgerGetQuery, LedgerListQuery, LedgerPayload } from './ledger.model';
import { applyLedgerListQuery } from './ledger.query';
import { LedgerService } from './ledger.service';
import { initialLedgerState } from './ledger.state';

const CATALOG_INCLUDES = ['category'] as const;
const CATALOG_INCLUDE_SET = new Set<string>(CATALOG_INCLUDES);
const CACHE_NAME = 'ledgers';

export const LedgerStore = signalStore(
  { providedIn: 'root' },
  withState(initialLedgerState),
  withComputed(({ ledger }) => ({
    catalog: computed(() => ledger().catalog),
    catalogLoaded: computed(() => ledger().catalogLoaded),
    catalogTotalCount: computed(() => ledger().catalogTotalCount),
    count: computed(() => ledger().count),
    error: computed(() => ledger().error),
    isLoading: computed(() => ledger().isLoading),
    items: computed(() => ledger().items),
    selectedItem: computed(() => ledger().selectedItem),
  })),
  withMethods(
    (
      store,
      service = inject(LedgerService),
      cachePrefs = inject(LedgerCachePreferencesStore),
      catalogCacheStore = inject(CatalogCacheService),
    ) => {
      let activeViewQuery: LedgerListQuery | undefined;

      const setLoading = (): void => {
        patchState(store, (state) => ({
          ledger: { ...state.ledger, error: null, isLoading: true },
        }));
      };

      const setError = (error: string): void => {
        patchState(store, (state) => ({
          ledger: { ...state.ledger, error, isLoading: false },
        }));
      };

      const clearCatalogState = (): void => {
        catalogCache.clearPendingLoad();
        activeViewQuery = undefined;
        patchState(store, (state) => ({
          ledger: {
            ...state.ledger,
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

      const applyViewQuery = (query?: LedgerListQuery): void => {
        activeViewQuery = query;
        const { items, count } = applyLedgerListQuery(store.ledger().catalog, query);
        patchState(store, (state) => ({
          ledger: { ...state.ledger, count, error: null, isLoading: false, items },
        }));
      };

      const fetchFullCatalog = async (): Promise<readonly Ledger[]> => {
        const total = await service.count({});
        if (total === 0) return [];
        return service.list({
          limit: total,
          offset: 0,
          includes: [...CATALOG_INCLUDES],
        });
      };

      const saveCatalog = (catalog: readonly Ledger[]): void => {
        patchState(store, (state) => ({
          ledger: {
            ...state.ledger,
            catalog,
            catalogLoaded: true,
            catalogTotalCount: catalog.length,
            error: null,
          },
        }));
      };

      const catalogCache = createCachedCrudLoader<Ledger>({
        canLoadCatalog: () => catalogCacheStore.currentScope() !== null,
        clearCatalog: () => catalogCacheStore.clearCatalog(CACHE_NAME),
        fetchCatalog: fetchFullCatalog,
        isEnabled: () => cachePrefs.enabled(),
        isLoaded: () => store.ledger().catalogLoaded,
        loadCatalog: () => catalogCacheStore.loadCatalog<Ledger>(CACHE_NAME),
        persistCatalog: (catalog) => catalogCacheStore.persistCatalog(CACHE_NAME, catalog),
        saveCatalog,
      });

      const cacheCatalogEntry = (ledger: Ledger): void => {
        if (!cachePrefs.enabled()) return;

        patchState(store, (state) => ({
          ledger: {
            ...state.ledger,
            catalog: upsertCachedEntity(state.ledger.catalog, ledger),
          },
        }));
        void catalogCacheStore.persistCatalog(CACHE_NAME, store.ledger().catalog);
      };

      const readIncludeRelation = (include: Lb4Include): string | null => {
        return typeof include === 'string' ? include : include.scope ? null : include.relation;
      };

      const areIncludesCovered = (query?: LedgerGetQuery): boolean => {
        return (
          !query?.includes?.length ||
          query.includes.every((include) => {
            const relation = readIncludeRelation(include);
            return relation !== null && CATALOG_INCLUDE_SET.has(relation);
          })
        );
      };

      const canUseCachedLedger = (query?: LedgerGetQuery): boolean => {
        return store.ledger().catalogLoaded && areIncludesCovered(query);
      };

      const selectLedger = (ledger: Ledger | null): void => {
        patchState(store, (state) => ({
          ledger: {
            ...state.ledger,
            error: null,
            isLoading: false,
            selectedItem: ledger,
          },
        }));
      };

      const selectCachedLedgerById = (id: string, query?: LedgerGetQuery): Ledger | null => {
        const cached = findCachedEntityById(store.ledger().catalog, id);
        if (!cached || !canUseCachedLedger(query)) {
          return null;
        }

        selectLedger(cached);
        return cached;
      };

      const loadLedgersFromApi = async (query?: LedgerListQuery): Promise<void> => {
        activeViewQuery = query;
        const [items, count] = await Promise.all([service.list(query), service.count(query)]);
        patchState(store, (state) => ({
          ledger: { ...state.ledger, count, error: null, isLoading: false, items },
        }));
      };

      const loadLedgerByIdFromApi = async (
        id: string,
        query?: LedgerGetQuery,
      ): Promise<Ledger | null> => {
        const item = await service.getById(id, query);
        cacheCatalogEntry(item);
        selectLedger(item);
        return item;
      };

      const ensureCatalogLoaded = async (forceReload = false): Promise<boolean> => {
        if (!cachePrefs.enabled()) return false;

        if (forceReload) {
          clearCatalogState();
        }

        return catalogCache.ensureLoaded();
      };

      const loadFullCatalogFromApi = async (forceReload = false): Promise<boolean> => {
        if (forceReload) {
          clearCatalogState();
        }

        if (store.ledger().catalogLoaded) return true;

        const catalog = await fetchFullCatalog();
        await catalogCacheStore.persistCatalog(CACHE_NAME, catalog);
        saveCatalog(catalog);
        return true;
      };

      const reapplyCachedView = (): void => {
        applyViewQuery(activeViewQuery);
      };

      return {
        clearCatalog(): void {
          clearCatalogState();
        },

        clearError(): void {
          patchState(store, (state) => ({
            ledger: { ...state.ledger, error: null },
          }));
        },

        clearSelectedItem(): void {
          patchState(store, (state) => ({
            ledger: { ...state.ledger, selectedItem: null },
          }));
        },

        setSelectedItem(ledger: Ledger): void {
          patchState(store, (state) => ({
            ledger: { ...state.ledger, selectedItem: ledger },
          }));
        },

        async ensureLedgerCatalogLoaded(forceReload = false): Promise<boolean> {
          setLoading();
          try {
            const loaded = cachePrefs.enabled()
              ? await ensureCatalogLoaded(forceReload)
              : await loadFullCatalogFromApi(forceReload);
            patchState(store, (state) => ({
              ledger: { ...state.ledger, error: null, isLoading: false },
            }));
            return loaded;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load ledgers.'));
            return false;
          }
        },

        async refreshLedgerCatalog(): Promise<boolean> {
          setLoading();
          try {
            const loaded = cachePrefs.enabled()
              ? await ensureCatalogLoaded(true)
              : await loadFullCatalogFromApi(true);
            patchState(store, (state) => ({
              ledger: { ...state.ledger, error: null, isLoading: false },
            }));
            return loaded;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load ledgers.'));
            return false;
          }
        },

        async createLedger(payload: LedgerPayload): Promise<Ledger | null> {
          setLoading();
          try {
            const item = await service.create(payload);
            if (cachePrefs.enabled() && store.ledger().catalogLoaded) {
              patchState(store, (state) => ({
                ledger: {
                  ...state.ledger,
                  catalog: upsertCachedEntity(state.ledger.catalog, item),
                  catalogTotalCount: state.ledger.catalogTotalCount + 1,
                  selectedItem: item,
                },
              }));
              reapplyCachedView();
              void catalogCacheStore.persistCatalog(CACHE_NAME, store.ledger().catalog);
            } else {
              patchState(store, (state) => ({
                ledger: {
                  ...state.ledger,
                  count: state.ledger.count + 1,
                  error: null,
                  isLoading: false,
                  items: [item, ...state.ledger.items],
                  selectedItem: item,
                },
              }));
            }
            return item;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to create ledger.'));
            return null;
          }
        },

        async deleteLedger(id: string): Promise<boolean> {
          setLoading();
          try {
            await service.delete(id);
            if (cachePrefs.enabled() && store.ledger().catalogLoaded) {
              patchState(store, (state) => ({
                ledger: {
                  ...state.ledger,
                  catalog: removeCachedEntityById(state.ledger.catalog, id),
                  catalogTotalCount: Math.max(state.ledger.catalogTotalCount - 1, 0),
                  selectedItem:
                    state.ledger.selectedItem?.id === id ? null : state.ledger.selectedItem,
                },
              }));
              reapplyCachedView();
              void catalogCacheStore.persistCatalog(CACHE_NAME, store.ledger().catalog);
            } else {
              patchState(store, (state) => ({
                ledger: {
                  ...state.ledger,
                  count: Math.max(state.ledger.count - 1, 0),
                  error: null,
                  isLoading: false,
                  items: state.ledger.items.filter((entry) => entry.id !== id),
                  selectedItem:
                    state.ledger.selectedItem?.id === id ? null : state.ledger.selectedItem,
                },
              }));
            }
            return true;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to delete ledger.'));
            return false;
          }
        },

        async loadLedgerById(id: string, query?: LedgerGetQuery): Promise<Ledger | null> {
          setLoading();
          try {
            if (!cachePrefs.enabled()) {
              return loadLedgerByIdFromApi(id, query);
            }

            const cached = selectCachedLedgerById(id, query);
            if (cached) {
              return cached;
            }

            if (store.ledger().catalogLoaded && areIncludesCovered(query)) {
              selectLedger(null);
              return null;
            }

            return loadLedgerByIdFromApi(id, query);
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load ledger.'));
            return null;
          }
        },

        async loadLedgers(query?: LedgerListQuery): Promise<void> {
          setLoading();
          try {
            const cacheReady = await ensureCatalogLoaded();
            if (cacheReady) {
              applyViewQuery(query);
              return;
            }

            await loadLedgersFromApi(query);
          } catch (error) {
            if (cachePrefs.enabled()) {
              try {
                await loadLedgersFromApi(query);
                return;
              } catch {
                // Keep the original cache error because it explains why cached mode failed.
              }
            }
            setError(getApiErrorMessage(error, 'Failed to load ledgers.'));
          }
        },

        async refreshLedgers(query?: LedgerListQuery): Promise<void> {
          setLoading();
          try {
            const cacheReady = await ensureCatalogLoaded(true);
            if (cacheReady) {
              applyViewQuery(query);
              return;
            }

            await loadLedgersFromApi(query);
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load ledgers.'));
          }
        },

        async updateLedger(id: string, payload: LedgerPayload): Promise<boolean> {
          setLoading();
          try {
            const updated = await service.update(id, payload);
            const mergeEntry = (entry: Ledger): Ledger =>
              entry.id === id ? { ...entry, ...payload, ...updated } : entry;

            if (cachePrefs.enabled() && store.ledger().catalogLoaded) {
              patchState(store, (state) => ({
                ledger: {
                  ...state.ledger,
                  catalog: updateCachedEntityById(state.ledger.catalog, id, mergeEntry),
                  selectedItem:
                    state.ledger.selectedItem?.id === id
                      ? mergeEntry(state.ledger.selectedItem)
                      : state.ledger.selectedItem,
                },
              }));
              reapplyCachedView();
              void catalogCacheStore.persistCatalog(CACHE_NAME, store.ledger().catalog);
            } else {
              patchState(store, (state) => ({
                ledger: {
                  ...state.ledger,
                  error: null,
                  isLoading: false,
                  items: state.ledger.items.map(mergeEntry),
                  selectedItem:
                    state.ledger.selectedItem?.id === id
                      ? mergeEntry(state.ledger.selectedItem)
                      : state.ledger.selectedItem,
                },
              }));
            }
            return true;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to update ledger.'));
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
      let previousOrganizationId = userSessionStore.session()?.organization?.id ?? null;

      effect(() => {
        const enabled = cachePrefs.enabled();
        if (previousEnabled && !enabled) {
          store.clearCatalog();
        }
        previousEnabled = enabled;
      });

      effect(() => {
        const organizationId = userSessionStore.session()?.organization?.id ?? null;
        if (previousOrganizationId !== null && organizationId !== previousOrganizationId) {
          store.clearCatalog();
        }
        previousOrganizationId = organizationId;
      });
    },
  }),
);
