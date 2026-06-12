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
import {
  createCachedCrudLoader,
  findCachedEntityById,
  type Lb4Include,
  removeCachedEntityById,
  updateCachedEntityById,
  upsertCachedEntity,
} from '../../../../../shared/crud';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type {
  ItemCategory,
  ItemCategoryGetQuery,
  ItemCategoryListQuery,
  ItemCategoryPayload,
} from './item-category.model';
import { applyItemCategoryListQuery } from './item-category.query';
import { ItemCategoryService } from './item-category.service';
import { initialItemCategoryState } from './item-category.state';

const CATALOG_INCLUDES = ['parent', 'taxgroup'] as const;
const CATALOG_INCLUDE_SET = new Set<string>(CATALOG_INCLUDES);

export const ItemCategoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialItemCategoryState),
  withComputed(({ itemCategory }) => ({
    catalog: computed(() => itemCategory().catalog),
    catalogLoaded: computed(() => itemCategory().catalogLoaded),
    catalogTotalCount: computed(() => itemCategory().catalogTotalCount),
    count: computed(() => itemCategory().count),
    error: computed(() => itemCategory().error),
    isLoading: computed(() => itemCategory().isLoading),
    items: computed(() => itemCategory().items),
    selectedItem: computed(() => itemCategory().selectedItem),
  })),
  withMethods((store, service = inject(ItemCategoryService)) => {
    let activeViewQuery: ItemCategoryListQuery | undefined;

    const setLoading = (): void => {
      patchState(store, (state) => ({
        itemCategory: { ...state.itemCategory, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        itemCategory: { ...state.itemCategory, error, isLoading: false },
      }));
    };

    const clearCatalogState = (): void => {
      catalogCache.clearPendingLoad();
      activeViewQuery = undefined;
      patchState(store, (state) => ({
        itemCategory: {
          ...state.itemCategory,
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

    const applyViewQuery = (query?: ItemCategoryListQuery): void => {
      activeViewQuery = query;
      const { items, count } = applyItemCategoryListQuery(store.itemCategory().catalog, query);
      patchState(store, (state) => ({
        itemCategory: { ...state.itemCategory, count, error: null, isLoading: false, items },
      }));
    };

    const fetchFullCatalog = async (): Promise<readonly ItemCategory[]> => {
      const total = await service.count({});
      if (total === 0) return [];
      return service.list({ limit: total, offset: 0, includes: [...CATALOG_INCLUDES] });
    };

    const saveCatalog = (catalog: readonly ItemCategory[]): void => {
      patchState(store, (state) => ({
        itemCategory: {
          ...state.itemCategory,
          catalog,
          catalogLoaded: true,
          catalogTotalCount: catalog.length,
          error: null,
        },
      }));
    };

    const catalogCache = createCachedCrudLoader<ItemCategory>({
      fetchCatalog: fetchFullCatalog,
      isEnabled: () => true,
      isLoaded: () => store.itemCategory().catalogLoaded,
      saveCatalog,
    });

    const readIncludeRelation = (include: Lb4Include): string | null =>
      typeof include === 'string' ? include : include.scope ? null : include.relation;

    const areIncludesCovered = (query?: ItemCategoryGetQuery): boolean =>
      !query?.includes?.length ||
      query.includes.every((include) => {
        const relation = readIncludeRelation(include);
        return relation !== null && CATALOG_INCLUDE_SET.has(relation);
      });

    const cacheCatalogEntry = (itemCategory: ItemCategory): void => {
      patchState(store, (state) => ({
        itemCategory: {
          ...state.itemCategory,
          catalog: upsertCachedEntity(state.itemCategory.catalog, itemCategory),
        },
      }));
    };

    const selectItemCategory = (itemCategory: ItemCategory | null): void => {
      patchState(store, (state) => ({
        itemCategory: {
          ...state.itemCategory,
          error: null,
          isLoading: false,
          selectedItem: itemCategory,
        },
      }));
    };

    const loadFromApi = async (query?: ItemCategoryListQuery): Promise<void> => {
      activeViewQuery = query;
      const [items, count] = await Promise.all([service.list(query), service.count(query)]);
      patchState(store, (state) => ({
        itemCategory: { ...state.itemCategory, count, error: null, isLoading: false, items },
      }));
    };

    const ensureCatalogLoaded = async (forceReload = false): Promise<boolean> => {
      if (forceReload) clearCatalogState();
      return catalogCache.ensureLoaded();
    };

    const reapplyCachedView = (): void => applyViewQuery(activeViewQuery);

    return {
      clearCatalog(): void {
        clearCatalogState();
      },
      clearError(): void {
        patchState(store, (state) => ({
          itemCategory: { ...state.itemCategory, error: null },
        }));
      },
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          itemCategory: { ...state.itemCategory, selectedItem: null },
        }));
      },
      setSelectedItem(itemCategory: ItemCategory): void {
        patchState(store, (state) => ({
          itemCategory: { ...state.itemCategory, selectedItem: itemCategory },
        }));
      },
      async ensureItemCategoryCatalogLoaded(forceReload = false): Promise<boolean> {
        setLoading();
        try {
          const loaded = await ensureCatalogLoaded(forceReload);
          patchState(store, (state) => ({
            itemCategory: { ...state.itemCategory, error: null, isLoading: false },
          }));
          return loaded;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load item categories.'));
          return false;
        }
      },
      async refreshItemCategoryCatalog(): Promise<boolean> {
        return ensureCatalogLoaded(true);
      },
      async createItemCategory(payload: ItemCategoryPayload): Promise<ItemCategory | null> {
        setLoading();
        try {
          const itemCategory = await service.create(payload);
          if (store.itemCategory().catalogLoaded) {
            patchState(store, (state) => ({
              itemCategory: {
                ...state.itemCategory,
                catalog: upsertCachedEntity(state.itemCategory.catalog, itemCategory),
                catalogTotalCount: state.itemCategory.catalogTotalCount + 1,
                selectedItem: itemCategory,
              },
            }));
            reapplyCachedView();
          } else {
            patchState(store, (state) => ({
              itemCategory: {
                ...state.itemCategory,
                count: state.itemCategory.count + 1,
                error: null,
                isLoading: false,
                items: [itemCategory, ...state.itemCategory.items],
                selectedItem: itemCategory,
              },
            }));
          }
          return itemCategory;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to create item category.'));
          return null;
        }
      },
      async deleteItemCategory(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          if (store.itemCategory().catalogLoaded) {
            patchState(store, (state) => ({
              itemCategory: {
                ...state.itemCategory,
                catalog: removeCachedEntityById(state.itemCategory.catalog, id),
                catalogTotalCount: Math.max(state.itemCategory.catalogTotalCount - 1, 0),
                selectedItem:
                  state.itemCategory.selectedItem?.id === id
                    ? null
                    : state.itemCategory.selectedItem,
              },
            }));
            reapplyCachedView();
          } else {
            patchState(store, (state) => ({
              itemCategory: {
                ...state.itemCategory,
                count: Math.max(state.itemCategory.count - 1, 0),
                error: null,
                isLoading: false,
                items: state.itemCategory.items.filter((itemCategory) => itemCategory.id !== id),
                selectedItem:
                  state.itemCategory.selectedItem?.id === id
                    ? null
                    : state.itemCategory.selectedItem,
              },
            }));
          }
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to delete item category.'));
          return false;
        }
      },
      async loadItemCategoryById(
        id: string,
        query?: ItemCategoryGetQuery,
      ): Promise<ItemCategory | null> {
        setLoading();
        try {
          const cached = findCachedEntityById(store.itemCategory().catalog, id);
          if (cached && store.itemCategory().catalogLoaded && areIncludesCovered(query)) {
            selectItemCategory(cached);
            return cached;
          }
          if (store.itemCategory().catalogLoaded && areIncludesCovered(query)) {
            selectItemCategory(null);
            return null;
          }
          const itemCategory = await service.getById(id, query);
          cacheCatalogEntry(itemCategory);
          selectItemCategory(itemCategory);
          return itemCategory;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load item category.'));
          return null;
        }
      },
      async loadItemCategories(query?: ItemCategoryListQuery): Promise<void> {
        setLoading();
        try {
          const cacheReady = await ensureCatalogLoaded();
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
          setError(getApiErrorMessage(error, 'Failed to load item categories.'));
        }
      },
      async refreshItemCategories(query?: ItemCategoryListQuery): Promise<void> {
        setLoading();
        try {
          const cacheReady = await ensureCatalogLoaded(true);
          if (cacheReady) {
            applyViewQuery(query);
            return;
          }
          await loadFromApi(query);
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load item categories.'));
        }
      },
      async updateItemCategory(id: string, payload: ItemCategoryPayload): Promise<boolean> {
        setLoading();
        try {
          const updated = await service.update(id, payload);
          const mergeEntry = (entry: ItemCategory): ItemCategory =>
            entry.id === id ? { ...entry, ...payload, ...updated } : entry;
          if (store.itemCategory().catalogLoaded) {
            patchState(store, (state) => ({
              itemCategory: {
                ...state.itemCategory,
                catalog: updateCachedEntityById(state.itemCategory.catalog, id, mergeEntry),
                selectedItem:
                  state.itemCategory.selectedItem?.id === id
                    ? mergeEntry(state.itemCategory.selectedItem)
                    : state.itemCategory.selectedItem,
              },
            }));
            reapplyCachedView();
          } else {
            patchState(store, (state) => ({
              itemCategory: {
                ...state.itemCategory,
                error: null,
                isLoading: false,
                items: state.itemCategory.items.map(mergeEntry),
                selectedItem:
                  state.itemCategory.selectedItem?.id === id
                    ? mergeEntry(state.itemCategory.selectedItem)
                    : state.itemCategory.selectedItem,
              },
            }));
          }
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update item category.'));
          return false;
        }
      },
    };
  }),
  withHooks({
    onInit(store) {
      const userSessionStore = inject(UserSessionStore);
      let previousOrganizationId = userSessionStore.session()?.organization?.id ?? null;

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
