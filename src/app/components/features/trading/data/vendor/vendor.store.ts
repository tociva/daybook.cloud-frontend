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
import type { Vendor, VendorGetQuery, VendorListQuery, VendorPayload } from './vendor.model';
import { applyVendorListQuery } from './vendor.query';
import { VendorService } from './vendor.service';
import { initialVendorState } from './vendor.state';

const hasUnsupportedIncludes = (query?: VendorGetQuery): boolean =>
  (query?.includes?.length ?? 0) > 0;

export const VendorStore = signalStore(
  { providedIn: 'root' },
  withState(initialVendorState),
  withComputed(({ vendor }) => ({
    catalog: computed(() => vendor().catalog),
    catalogLoaded: computed(() => vendor().catalogLoaded),
    catalogTotalCount: computed(() => vendor().catalogTotalCount),
    count: computed(() => vendor().count),
    error: computed(() => vendor().error),
    isLoading: computed(() => vendor().isLoading),
    items: computed(() => vendor().items),
    selectedItem: computed(() => vendor().selectedItem),
  })),
  withMethods((store, service = inject(VendorService)) => {
    let activeViewQuery: VendorListQuery | undefined;

    const setLoading = (): void => {
      patchState(store, (state) => ({
        vendor: { ...state.vendor, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        vendor: { ...state.vendor, error, isLoading: false },
      }));
    };

    const clearCatalogState = (): void => {
      catalogCache.clearPendingLoad();
      activeViewQuery = undefined;
      patchState(store, (state) => ({
        vendor: {
          ...state.vendor,
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

    const applyViewQuery = (query?: VendorListQuery): void => {
      activeViewQuery = query;
      const { items, count } = applyVendorListQuery(store.vendor().catalog, query);
      patchState(store, (state) => ({
        vendor: { ...state.vendor, count, error: null, isLoading: false, items },
      }));
    };

    const fetchFullCatalog = async (): Promise<readonly Vendor[]> => {
      const total = await service.count({});
      if (total === 0) return [];
      return service.list({ limit: total, offset: 0 });
    };

    const saveCatalog = (catalog: readonly Vendor[]): void => {
      patchState(store, (state) => ({
        vendor: {
          ...state.vendor,
          catalog,
          catalogLoaded: true,
          catalogTotalCount: catalog.length,
          error: null,
        },
      }));
    };

    const catalogCache = createCachedCrudLoader<Vendor>({
      fetchCatalog: fetchFullCatalog,
      isEnabled: () => true,
      isLoaded: () => store.vendor().catalogLoaded,
      saveCatalog,
    });

    const ensureCatalogLoaded = async (forceReload = false): Promise<boolean> => {
      if (forceReload) clearCatalogState();
      return catalogCache.ensureLoaded();
    };

    const cacheCatalogEntry = (vendor: Vendor): void => {
      patchState(store, (state) => ({
        vendor: { ...state.vendor, catalog: upsertCachedEntity(state.vendor.catalog, vendor) },
      }));
    };

    const selectVendor = (vendor: Vendor | null): void => {
      patchState(store, (state) => ({
        vendor: { ...state.vendor, error: null, isLoading: false, selectedItem: vendor },
      }));
    };

    const loadFromApi = async (query?: VendorListQuery): Promise<void> => {
      activeViewQuery = query;
      const [items, count] = await Promise.all([service.list(query), service.count(query)]);
      patchState(store, (state) => ({
        vendor: { ...state.vendor, count, error: null, isLoading: false, items },
      }));
    };

    const reapplyCachedView = (): void => applyViewQuery(activeViewQuery);

    return {
      clearCatalog(): void {
        clearCatalogState();
      },
      clearError(): void {
        patchState(store, (state) => ({
          vendor: { ...state.vendor, error: null },
        }));
      },
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          vendor: { ...state.vendor, selectedItem: null },
        }));
      },
      setSelectedItem(vendor: Vendor): void {
        patchState(store, (state) => ({
          vendor: { ...state.vendor, selectedItem: vendor },
        }));
      },
      async ensureVendorCatalogLoaded(forceReload = false): Promise<boolean> {
        setLoading();
        try {
          const loaded = await ensureCatalogLoaded(forceReload);
          patchState(store, (state) => ({
            vendor: { ...state.vendor, error: null, isLoading: false },
          }));
          return loaded;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load vendors.'));
          return false;
        }
      },
      async refreshVendorCatalog(): Promise<boolean> {
        return ensureCatalogLoaded(true);
      },
      async createVendor(payload: VendorPayload): Promise<Vendor | null> {
        setLoading();
        try {
          const vendor = await service.create(payload);
          if (store.vendor().catalogLoaded) {
            patchState(store, (state) => ({
              vendor: {
                ...state.vendor,
                catalog: upsertCachedEntity(state.vendor.catalog, vendor),
                catalogTotalCount: state.vendor.catalogTotalCount + 1,
                selectedItem: vendor,
              },
            }));
            reapplyCachedView();
          } else {
            patchState(store, (state) => ({
              vendor: {
                ...state.vendor,
                count: state.vendor.count + 1,
                error: null,
                isLoading: false,
                items: [vendor, ...state.vendor.items],
                selectedItem: vendor,
              },
            }));
          }
          return vendor;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to create vendor.'));
          return null;
        }
      },
      async deleteVendor(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          if (store.vendor().catalogLoaded) {
            patchState(store, (state) => ({
              vendor: {
                ...state.vendor,
                catalog: removeCachedEntityById(state.vendor.catalog, id),
                catalogTotalCount: Math.max(state.vendor.catalogTotalCount - 1, 0),
                selectedItem: state.vendor.selectedItem?.id === id ? null : state.vendor.selectedItem,
              },
            }));
            reapplyCachedView();
          } else {
            patchState(store, (state) => ({
              vendor: {
                ...state.vendor,
                count: Math.max(state.vendor.count - 1, 0),
                error: null,
                isLoading: false,
                items: state.vendor.items.filter((vendor) => vendor.id !== id),
                selectedItem: state.vendor.selectedItem?.id === id ? null : state.vendor.selectedItem,
              },
            }));
          }
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to delete vendor.'));
          return false;
        }
      },
      async loadVendorById(id: string, query?: VendorGetQuery): Promise<Vendor | null> {
        setLoading();
        try {
          const cached = findCachedEntityById(store.vendor().catalog, id);
          if (cached && store.vendor().catalogLoaded && !hasUnsupportedIncludes(query)) {
            selectVendor(cached);
            return cached;
          }
          if (store.vendor().catalogLoaded && !hasUnsupportedIncludes(query)) {
            selectVendor(null);
            return null;
          }
          const vendor = await service.getById(id, query);
          cacheCatalogEntry(vendor);
          selectVendor(vendor);
          return vendor;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load vendor.'));
          return null;
        }
      },
      async loadVendors(query?: VendorListQuery): Promise<void> {
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
          setError(getApiErrorMessage(error, 'Failed to load vendors.'));
        }
      },
      async refreshVendors(query?: VendorListQuery): Promise<void> {
        setLoading();
        try {
          const cacheReady = await ensureCatalogLoaded(true);
          if (cacheReady) {
            applyViewQuery(query);
            return;
          }
          await loadFromApi(query);
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load vendors.'));
        }
      },
      async updateVendor(id: string, payload: VendorPayload): Promise<boolean> {
        setLoading();
        try {
          const updated = await service.update(id, payload);
          const mergeEntry = (entry: Vendor): Vendor =>
            entry.id === id ? { ...entry, ...payload, ...updated } : entry;
          if (store.vendor().catalogLoaded) {
            patchState(store, (state) => ({
              vendor: {
                ...state.vendor,
                catalog: updateCachedEntityById(state.vendor.catalog, id, mergeEntry),
                selectedItem:
                  state.vendor.selectedItem?.id === id
                    ? mergeEntry(state.vendor.selectedItem)
                    : state.vendor.selectedItem,
              },
            }));
            reapplyCachedView();
          } else {
            patchState(store, (state) => ({
              vendor: {
                ...state.vendor,
                error: null,
                isLoading: false,
                items: state.vendor.items.map(mergeEntry),
                selectedItem:
                  state.vendor.selectedItem?.id === id
                    ? mergeEntry(state.vendor.selectedItem)
                    : state.vendor.selectedItem,
              },
            }));
          }
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update vendor.'));
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
