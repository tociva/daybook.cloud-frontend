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
  removeCachedEntityById,
  updateCachedEntityById,
  upsertCachedEntity,
} from '../../../../../shared/crud';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type { TaxGroup, TaxGroupListQuery, TaxGroupPayload } from './tax-group.model';
import { applyTaxGroupListQuery } from './tax-group.query';
import { TaxGroupService } from './tax-group.service';
import { initialTaxGroupState } from './tax-group.state';

export const TaxGroupStore = signalStore(
  { providedIn: 'root' },
  withState(initialTaxGroupState),
  withComputed(({ taxGroup }) => ({
    catalog: computed(() => taxGroup().catalog),
    catalogLoaded: computed(() => taxGroup().catalogLoaded),
    catalogTotalCount: computed(() => taxGroup().catalogTotalCount),
    count: computed(() => taxGroup().count),
    error: computed(() => taxGroup().error),
    isLoading: computed(() => taxGroup().isLoading),
    items: computed(() => taxGroup().items),
    selectedItem: computed(() => taxGroup().selectedItem),
  })),
  withMethods((store, service = inject(TaxGroupService)) => {
    let activeViewQuery: TaxGroupListQuery | undefined;

    const setLoading = (): void => {
      patchState(store, (state) => ({
        taxGroup: { ...state.taxGroup, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        taxGroup: { ...state.taxGroup, error, isLoading: false },
      }));
    };

    const clearCatalogState = (): void => {
      catalogCache.clearPendingLoad();
      activeViewQuery = undefined;
      patchState(store, (state) => ({
        taxGroup: {
          ...state.taxGroup,
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

    const applyViewQuery = (query?: TaxGroupListQuery): void => {
      activeViewQuery = query;
      const { items, count } = applyTaxGroupListQuery(store.taxGroup().catalog, query);
      patchState(store, (state) => ({
        taxGroup: { ...state.taxGroup, count, error: null, isLoading: false, items },
      }));
    };

    const fetchFullCatalog = async (): Promise<readonly TaxGroup[]> => {
      const total = await service.count({});
      if (total === 0) return [];
      return service.list({ limit: total, offset: 0 });
    };

    const saveCatalog = (catalog: readonly TaxGroup[]): void => {
      patchState(store, (state) => ({
        taxGroup: {
          ...state.taxGroup,
          catalog,
          catalogLoaded: true,
          catalogTotalCount: catalog.length,
          error: null,
        },
      }));
    };

    const catalogCache = createCachedCrudLoader<TaxGroup>({
      fetchCatalog: fetchFullCatalog,
      isEnabled: () => true,
      isLoaded: () => store.taxGroup().catalogLoaded,
      saveCatalog,
    });

    const cacheCatalogEntry = (taxGroup: TaxGroup): void => {
      patchState(store, (state) => ({
        taxGroup: {
          ...state.taxGroup,
          catalog: upsertCachedEntity(state.taxGroup.catalog, taxGroup),
        },
      }));
    };

    const selectTaxGroup = (taxGroup: TaxGroup | null): void => {
      patchState(store, (state) => ({
        taxGroup: { ...state.taxGroup, error: null, isLoading: false, selectedItem: taxGroup },
      }));
    };

    const loadFromApi = async (query?: TaxGroupListQuery): Promise<void> => {
      activeViewQuery = query;
      const [items, count] = await Promise.all([service.list(query), service.count(query)]);
      patchState(store, (state) => ({
        taxGroup: { ...state.taxGroup, count, error: null, isLoading: false, items },
      }));
    };

    const ensureCatalogLoaded = async (forceReload = false): Promise<boolean> => {
      if (forceReload) clearCatalogState();
      return catalogCache.ensureLoaded();
    };

    const reapplyCachedView = (): void => applyViewQuery(activeViewQuery);

    const getModeSource = (): readonly TaxGroup[] =>
      store.taxGroup().catalogLoaded ? store.taxGroup().catalog : store.taxGroup().items;

    return {
      clearCatalog(): void {
        clearCatalogState();
      },
      clearError(): void {
        patchState(store, (state) => ({
          taxGroup: { ...state.taxGroup, error: null },
        }));
      },
      getAvailableModes(): string[] {
        return Array.from(
          new Set(
            getModeSource()
              .flatMap((item) => item.groups ?? [])
              .map((group) => group.mode?.trim())
              .filter((mode): mode is string => Boolean(mode)),
          ),
        );
      },
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          taxGroup: { ...state.taxGroup, selectedItem: null },
        }));
      },
      setSelectedItem(taxGroup: TaxGroup): void {
        patchState(store, (state) => ({
          taxGroup: { ...state.taxGroup, selectedItem: taxGroup },
        }));
      },
      async ensureTaxGroupCatalogLoaded(forceReload = false): Promise<boolean> {
        setLoading();
        try {
          const loaded = await ensureCatalogLoaded(forceReload);
          patchState(store, (state) => ({
            taxGroup: { ...state.taxGroup, error: null, isLoading: false },
          }));
          return loaded;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load tax groups.'));
          return false;
        }
      },
      async refreshTaxGroupCatalog(): Promise<boolean> {
        return ensureCatalogLoaded(true);
      },
      async createTaxGroup(payload: TaxGroupPayload): Promise<TaxGroup | null> {
        setLoading();
        try {
          const taxGroup = await service.create(payload);
          if (store.taxGroup().catalogLoaded) {
            patchState(store, (state) => ({
              taxGroup: {
                ...state.taxGroup,
                catalog: upsertCachedEntity(state.taxGroup.catalog, taxGroup),
                catalogTotalCount: state.taxGroup.catalogTotalCount + 1,
                selectedItem: taxGroup,
              },
            }));
            reapplyCachedView();
          } else {
            patchState(store, (state) => ({
              taxGroup: {
                ...state.taxGroup,
                count: state.taxGroup.count + 1,
                error: null,
                isLoading: false,
                items: [taxGroup, ...state.taxGroup.items],
                selectedItem: taxGroup,
              },
            }));
          }
          return taxGroup;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to create tax group.'));
          return null;
        }
      },
      async deleteTaxGroup(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          if (store.taxGroup().catalogLoaded) {
            patchState(store, (state) => ({
              taxGroup: {
                ...state.taxGroup,
                catalog: removeCachedEntityById(state.taxGroup.catalog, id),
                catalogTotalCount: Math.max(state.taxGroup.catalogTotalCount - 1, 0),
                selectedItem:
                  state.taxGroup.selectedItem?.id === id ? null : state.taxGroup.selectedItem,
              },
            }));
            reapplyCachedView();
          } else {
            patchState(store, (state) => ({
              taxGroup: {
                ...state.taxGroup,
                count: Math.max(state.taxGroup.count - 1, 0),
                error: null,
                isLoading: false,
                items: state.taxGroup.items.filter((taxGroup) => taxGroup.id !== id),
                selectedItem:
                  state.taxGroup.selectedItem?.id === id ? null : state.taxGroup.selectedItem,
              },
            }));
          }
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to delete tax group.'));
          return false;
        }
      },
      async loadTaxGroupById(id: string): Promise<TaxGroup | null> {
        setLoading();
        try {
          const cached = findCachedEntityById(store.taxGroup().catalog, id);
          if (cached && store.taxGroup().catalogLoaded) {
            selectTaxGroup(cached);
            return cached;
          }
          if (store.taxGroup().catalogLoaded) {
            selectTaxGroup(null);
            return null;
          }
          const taxGroup = await service.getById(id);
          cacheCatalogEntry(taxGroup);
          selectTaxGroup(taxGroup);
          return taxGroup;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load tax group.'));
          return null;
        }
      },
      async loadTaxGroups(query?: TaxGroupListQuery): Promise<void> {
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
          setError(getApiErrorMessage(error, 'Failed to load tax groups.'));
        }
      },
      async refreshTaxGroups(query?: TaxGroupListQuery): Promise<void> {
        setLoading();
        try {
          const cacheReady = await ensureCatalogLoaded(true);
          if (cacheReady) {
            applyViewQuery(query);
            return;
          }
          await loadFromApi(query);
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load tax groups.'));
        }
      },
      async updateTaxGroup(id: string, payload: TaxGroupPayload): Promise<boolean> {
        setLoading();
        try {
          const updated = await service.update(id, payload);
          const mergeEntry = (entry: TaxGroup): TaxGroup =>
            entry.id === id ? { ...entry, ...payload, ...updated } : entry;
          if (store.taxGroup().catalogLoaded) {
            patchState(store, (state) => ({
              taxGroup: {
                ...state.taxGroup,
                catalog: updateCachedEntityById(state.taxGroup.catalog, id, mergeEntry),
                selectedItem:
                  state.taxGroup.selectedItem?.id === id
                    ? mergeEntry(state.taxGroup.selectedItem)
                    : state.taxGroup.selectedItem,
              },
            }));
            reapplyCachedView();
          } else {
            patchState(store, (state) => ({
              taxGroup: {
                ...state.taxGroup,
                error: null,
                isLoading: false,
                items: state.taxGroup.items.map(mergeEntry),
                selectedItem:
                  state.taxGroup.selectedItem?.id === id
                    ? mergeEntry(state.taxGroup.selectedItem)
                    : state.taxGroup.selectedItem,
              },
            }));
          }
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update tax group.'));
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
