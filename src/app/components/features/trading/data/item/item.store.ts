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
import type { Item, ItemGetQuery, ItemListQuery, ItemPayload } from './item.model';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import { applyItemListQuery } from './item.query';
import { ItemService } from './item.service';
import { initialItemState } from './item.state';

const CATALOG_INCLUDES = ['category'] as const;
const CATALOG_INCLUDE_SET = new Set<string>(CATALOG_INCLUDES);
const CACHE_NAME = 'items';

export const ItemStore = signalStore(
  { providedIn: 'root' },
  withState(initialItemState),
  withComputed(({ item }) => ({
    catalog: computed(() => item().catalog),
    catalogLoaded: computed(() => item().catalogLoaded),
    catalogTotalCount: computed(() => item().catalogTotalCount),
    count: computed(() => item().count),
    createDraft: computed(() => item().createDraft),
    error: computed(() => item().error),
    isLoading: computed(() => item().isLoading),
    items: computed(() => item().items),
    selectedItem: computed(() => item().selectedItem),
  })),
  withMethods(
    (
      store,
      service = inject(ItemService),
      catalogCacheStore = inject(CatalogCacheService),
      cachePrefs = inject(LedgerCachePreferencesStore),
    ) => {
      let activeViewQuery: ItemListQuery | undefined;

      const setLoading = (): void => {
        patchState(store, (state) => ({
          item: { ...state.item, error: null, isLoading: true },
        }));
      };

      const setError = (error: string): void => {
        patchState(store, (state) => ({
          item: { ...state.item, error, isLoading: false },
        }));
      };

      const clearCatalogState = (): void => {
        catalogCache.clearPendingLoad();
        activeViewQuery = undefined;
        patchState(store, (state) => ({
          item: {
            ...state.item,
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

      const applyViewQuery = (query?: ItemListQuery): void => {
        activeViewQuery = query;
        const { items, count } = applyItemListQuery(store.item().catalog, query);
        patchState(store, (state) => ({
          item: { ...state.item, count, error: null, isLoading: false, items },
        }));
      };

      const fetchFullCatalog = async (): Promise<readonly Item[]> => {
        const total = await service.count({});
        if (total === 0) return [];
        return service.list({
          limit: total,
          offset: 0,
          includes: [...CATALOG_INCLUDES],
        });
      };

      const saveCatalog = (catalog: readonly Item[]): void => {
        patchState(store, (state) => ({
          item: {
            ...state.item,
            catalog,
            catalogLoaded: true,
            catalogTotalCount: catalog.length,
            error: null,
          },
        }));
      };

      const catalogCache = createCachedCrudLoader<Item>({
        canLoadCatalog: () => catalogCacheStore.currentScope() !== null,
        clearCatalog: () => catalogCacheStore.clearCatalog(CACHE_NAME),
        fetchCatalog: fetchFullCatalog,
        isEnabled: () => cachePrefs.enabled(),
        isLoaded: () => store.item().catalogLoaded,
        loadCatalog: () => catalogCacheStore.loadCatalog<Item>(CACHE_NAME),
        persistCatalog: (catalog) => catalogCacheStore.persistCatalog(CACHE_NAME, catalog),
        saveCatalog,
      });

      const cacheCatalogEntry = (item: Item): void => {
        if (!cachePrefs.enabled()) return;

        patchState(store, (state) => ({
          item: {
            ...state.item,
            catalog: upsertCachedEntity(state.item.catalog, item),
          },
        }));
        void catalogCacheStore.persistCatalog(CACHE_NAME, store.item().catalog);
      };

      const readIncludeRelation = (include: Lb4Include): string | null => {
        return typeof include === 'string' ? include : include.scope ? null : include.relation;
      };

      const areIncludesCovered = (query?: ItemGetQuery): boolean => {
        return (
          !query?.includes?.length ||
          query.includes.every((include) => {
            const relation = readIncludeRelation(include);
            return relation !== null && CATALOG_INCLUDE_SET.has(relation);
          })
        );
      };

      const canUseCachedItem = (query?: ItemGetQuery): boolean => {
        return store.item().catalogLoaded && areIncludesCovered(query);
      };

      const selectItem = (item: Item | null): void => {
        patchState(store, (state) => ({
          item: {
            ...state.item,
            error: null,
            isLoading: false,
            selectedItem: item,
          },
        }));
      };

      const selectCachedItemById = (id: string, query?: ItemGetQuery): Item | null => {
        const cached = findCachedEntityById(store.item().catalog, id);
        if (!cached || !canUseCachedItem(query)) {
          return null;
        }

        selectItem(cached);
        return cached;
      };

      const loadItemsFromApi = async (query?: ItemListQuery): Promise<void> => {
        activeViewQuery = query;
        const [items, count] = await Promise.all([service.list(query), service.count(query)]);
        patchState(store, (state) => ({
          item: { ...state.item, count, error: null, isLoading: false, items },
        }));
      };

      const loadItemByIdFromApi = async (
        id: string,
        query?: ItemGetQuery,
      ): Promise<Item | null> => {
        const item = await service.getById(id, query);
        cacheCatalogEntry(item);
        selectItem(item);
        return item;
      };

      const ensureCatalogLoaded = async (forceReload = false): Promise<boolean> => {
        if (!cachePrefs.enabled()) return false;
        if (forceReload) {
          clearCatalogState();
        }

        return catalogCache.ensureLoaded();
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
            item: { ...state.item, error: null },
          }));
        },

        clearSelectedItem(): void {
          patchState(store, (state) => ({
            item: { ...state.item, selectedItem: null },
          }));
        },

        setSelectedItem(item: Item): void {
          patchState(store, (state) => ({
            item: { ...state.item, selectedItem: item },
          }));
        },

        clearCreateDraft(): void {
          patchState(store, (state) => ({
            item: { ...state.item, createDraft: null },
          }));
        },

        setCreateDraft(draft: Item): void {
          patchState(store, (state) => ({
            item: { ...state.item, createDraft: draft },
          }));
        },

        async ensureItemCatalogLoaded(forceReload = false): Promise<boolean> {
          setLoading();
          try {
            const loaded = await ensureCatalogLoaded(forceReload);
            patchState(store, (state) => ({
              item: { ...state.item, error: null, isLoading: false },
            }));
            return loaded;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load items.'));
            return false;
          }
        },

        async refreshItemCatalog(): Promise<boolean> {
          setLoading();
          try {
            const loaded = await ensureCatalogLoaded(true);
            patchState(store, (state) => ({
              item: { ...state.item, error: null, isLoading: false },
            }));
            return loaded;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load items.'));
            return false;
          }
        },

        async createItem(payload: ItemPayload): Promise<Item | null> {
          setLoading();
          try {
            const item = await service.create(payload);
            if (store.item().catalogLoaded) {
              patchState(store, (state) => ({
                item: {
                  ...state.item,
                  catalog: upsertCachedEntity(state.item.catalog, item),
                  catalogTotalCount: state.item.catalogTotalCount + 1,
                  selectedItem: item,
                },
              }));
              reapplyCachedView();
              void catalogCacheStore.persistCatalog(CACHE_NAME, store.item().catalog);
            } else {
              patchState(store, (state) => ({
                item: {
                  ...state.item,
                  count: state.item.count + 1,
                  error: null,
                  isLoading: false,
                  items: [item, ...state.item.items],
                  selectedItem: item,
                },
              }));
            }
            return item;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to create item.'));
            return null;
          }
        },

        async deleteItem(id: string): Promise<boolean> {
          setLoading();
          try {
            await service.delete(id);
            if (store.item().catalogLoaded) {
              patchState(store, (state) => ({
                item: {
                  ...state.item,
                  catalog: removeCachedEntityById(state.item.catalog, id),
                  catalogTotalCount: Math.max(state.item.catalogTotalCount - 1, 0),
                  selectedItem: state.item.selectedItem?.id === id ? null : state.item.selectedItem,
                },
              }));
              reapplyCachedView();
              void catalogCacheStore.persistCatalog(CACHE_NAME, store.item().catalog);
            } else {
              patchState(store, (state) => ({
                item: {
                  ...state.item,
                  count: Math.max(state.item.count - 1, 0),
                  error: null,
                  isLoading: false,
                  items: state.item.items.filter((item) => item.id !== id),
                  selectedItem: state.item.selectedItem?.id === id ? null : state.item.selectedItem,
                },
              }));
            }
            return true;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to delete item.'));
            return false;
          }
        },

        async loadItemById(id: string, query?: ItemGetQuery): Promise<Item | null> {
          setLoading();
          try {
            const cached = selectCachedItemById(id, query);
            if (cached) {
              return cached;
            }

            if (store.item().catalogLoaded && areIncludesCovered(query)) {
              selectItem(null);
              return null;
            }

            return loadItemByIdFromApi(id, query);
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load item.'));
            return null;
          }
        },

        async loadItems(query?: ItemListQuery): Promise<void> {
          setLoading();
          try {
            const cacheReady = await ensureCatalogLoaded();
            if (cacheReady) {
              applyViewQuery(query);
              return;
            }

            await loadItemsFromApi(query);
          } catch (error) {
            try {
              await loadItemsFromApi(query);
              return;
            } catch {
              // Keep the original cache error because it explains why cached mode failed.
            }
            setError(getApiErrorMessage(error, 'Failed to load items.'));
          }
        },

        async refreshItems(query?: ItemListQuery): Promise<void> {
          setLoading();
          try {
            const cacheReady = await ensureCatalogLoaded(true);
            if (cacheReady) {
              applyViewQuery(query);
              return;
            }

            await loadItemsFromApi(query);
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load items.'));
          }
        },

        async updateItem(id: string, payload: ItemPayload): Promise<boolean> {
          setLoading();
          try {
            const updated = await service.update(id, payload);
            const mergeEntry = (entry: Item): Item =>
              entry.id === id ? { ...entry, ...payload, ...updated } : entry;

            if (store.item().catalogLoaded) {
              patchState(store, (state) => ({
                item: {
                  ...state.item,
                  catalog: updateCachedEntityById(state.item.catalog, id, mergeEntry),
                  selectedItem:
                    state.item.selectedItem?.id === id
                      ? mergeEntry(state.item.selectedItem)
                      : state.item.selectedItem,
                },
              }));
              reapplyCachedView();
              void catalogCacheStore.persistCatalog(CACHE_NAME, store.item().catalog);
            } else {
              patchState(store, (state) => {
                const existing = state.item.items.find((currentItem) => currentItem.id === id);
                const selected =
                  state.item.selectedItem?.id === id ? state.item.selectedItem : null;
                const mergedItem = existing
                  ? mergeEntry(existing)
                  : selected
                    ? mergeEntry(selected)
                    : state.item.selectedItem;
                return {
                  item: {
                    ...state.item,
                    error: null,
                    isLoading: false,
                    items: state.item.items.map(mergeEntry),
                    selectedItem: mergedItem,
                  },
                };
              });
            }
            return true;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to update item.'));
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
