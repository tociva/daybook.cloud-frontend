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
  removeCachedEntityById,
  updateCachedEntityById,
  upsertCachedEntity,
} from '../../../../../shared/crud';
import type { Tax, TaxListQuery, TaxPayload } from './tax.model';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import { applyTaxListQuery } from './tax.query';
import { TaxService } from './tax.service';
import { initialTaxState } from './tax.state';

const CACHE_NAME = 'taxes';

export const TaxStore = signalStore(
  { providedIn: 'root' },
  withState(initialTaxState),
  withComputed(({ tax }) => ({
    catalog: computed(() => tax().catalog),
    catalogLoaded: computed(() => tax().catalogLoaded),
    catalogTotalCount: computed(() => tax().catalogTotalCount),
    count: computed(() => tax().count),
    error: computed(() => tax().error),
    isLoading: computed(() => tax().isLoading),
    items: computed(() => tax().items),
    selectedItem: computed(() => tax().selectedItem),
  })),
  withMethods(
    (
      store,
      service = inject(TaxService),
      catalogCacheStore = inject(CatalogCacheService),
      cachePrefs = inject(LedgerCachePreferencesStore),
    ) => {
      let activeViewQuery: TaxListQuery | undefined;

      const setLoading = (): void => {
        patchState(store, (state) => ({
          tax: { ...state.tax, error: null, isLoading: true },
        }));
      };

      const setError = (error: string): void => {
        patchState(store, (state) => ({
          tax: { ...state.tax, error, isLoading: false },
        }));
      };

      const clearCatalogState = (): void => {
        catalogCache.clearPendingLoad();
        activeViewQuery = undefined;
        patchState(store, (state) => ({
          tax: {
            ...state.tax,
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

      const applyViewQuery = (query?: TaxListQuery): void => {
        activeViewQuery = query;
        const { items, count } = applyTaxListQuery(store.tax().catalog, query);
        patchState(store, (state) => ({
          tax: { ...state.tax, count, error: null, isLoading: false, items },
        }));
      };

      const fetchFullCatalog = async (): Promise<readonly Tax[]> => {
        const total = await service.count({});
        if (total === 0) return [];
        return service.list({ limit: total, offset: 0 });
      };

      const saveCatalog = (catalog: readonly Tax[]): void => {
        patchState(store, (state) => ({
          tax: {
            ...state.tax,
            catalog,
            catalogLoaded: true,
            catalogTotalCount: catalog.length,
            error: null,
          },
        }));
      };

      const catalogCache = createCachedCrudLoader<Tax>({
        canLoadCatalog: () => catalogCacheStore.currentScope() !== null,
        clearCatalog: () => catalogCacheStore.clearCatalog(CACHE_NAME),
        fetchCatalog: fetchFullCatalog,
        isEnabled: () => cachePrefs.enabled(),
        isLoaded: () => store.tax().catalogLoaded,
        loadCatalog: () => catalogCacheStore.loadCatalog<Tax>(CACHE_NAME),
        persistCatalog: (catalog) => catalogCacheStore.persistCatalog(CACHE_NAME, catalog),
        saveCatalog,
      });

      const cacheCatalogEntry = (tax: Tax): void => {
        if (!cachePrefs.enabled()) return;

        patchState(store, (state) => ({
          tax: { ...state.tax, catalog: upsertCachedEntity(state.tax.catalog, tax) },
        }));
        void catalogCacheStore.persistCatalog(CACHE_NAME, store.tax().catalog);
      };

      const selectTax = (tax: Tax | null): void => {
        patchState(store, (state) => ({
          tax: { ...state.tax, error: null, isLoading: false, selectedItem: tax },
        }));
      };

      const loadFromApi = async (query?: TaxListQuery): Promise<void> => {
        activeViewQuery = query;
        const [items, count] = await Promise.all([service.list(query), service.count(query)]);
        patchState(store, (state) => ({
          tax: { ...state.tax, count, error: null, isLoading: false, items },
        }));
      };

      const ensureCatalogLoaded = async (forceReload = false): Promise<boolean> => {
        if (!cachePrefs.enabled()) return false;
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
            tax: { ...state.tax, error: null },
          }));
        },
        clearSelectedItem(): void {
          patchState(store, (state) => ({
            tax: { ...state.tax, selectedItem: null },
          }));
        },
        setSelectedItem(tax: Tax): void {
          patchState(store, (state) => ({
            tax: { ...state.tax, selectedItem: tax },
          }));
        },
        async ensureTaxCatalogLoaded(forceReload = false): Promise<boolean> {
          setLoading();
          try {
            const loaded = await ensureCatalogLoaded(forceReload);
            patchState(store, (state) => ({
              tax: { ...state.tax, error: null, isLoading: false },
            }));
            return loaded;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load taxes.'));
            return false;
          }
        },
        async refreshTaxCatalog(): Promise<boolean> {
          return ensureCatalogLoaded(true);
        },
        async createTax(payload: TaxPayload): Promise<Tax | null> {
          setLoading();
          try {
            const tax = await service.create(payload);
            if (store.tax().catalogLoaded) {
              patchState(store, (state) => ({
                tax: {
                  ...state.tax,
                  catalog: upsertCachedEntity(state.tax.catalog, tax),
                  catalogTotalCount: state.tax.catalogTotalCount + 1,
                  selectedItem: tax,
                },
              }));
              reapplyCachedView();
              void catalogCacheStore.persistCatalog(CACHE_NAME, store.tax().catalog);
            } else {
              patchState(store, (state) => ({
                tax: {
                  ...state.tax,
                  count: state.tax.count + 1,
                  error: null,
                  isLoading: false,
                  items: [tax, ...state.tax.items],
                  selectedItem: tax,
                },
              }));
            }
            return tax;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to create tax.'));
            return null;
          }
        },
        async deleteTax(id: string): Promise<boolean> {
          setLoading();
          try {
            await service.delete(id);
            if (store.tax().catalogLoaded) {
              patchState(store, (state) => ({
                tax: {
                  ...state.tax,
                  catalog: removeCachedEntityById(state.tax.catalog, id),
                  catalogTotalCount: Math.max(state.tax.catalogTotalCount - 1, 0),
                  selectedItem: state.tax.selectedItem?.id === id ? null : state.tax.selectedItem,
                },
              }));
              reapplyCachedView();
              void catalogCacheStore.persistCatalog(CACHE_NAME, store.tax().catalog);
            } else {
              patchState(store, (state) => ({
                tax: {
                  ...state.tax,
                  count: Math.max(state.tax.count - 1, 0),
                  error: null,
                  isLoading: false,
                  items: state.tax.items.filter((tax) => tax.id !== id),
                  selectedItem: state.tax.selectedItem?.id === id ? null : state.tax.selectedItem,
                },
              }));
            }
            return true;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to delete tax.'));
            return false;
          }
        },
        async loadTaxById(id: string): Promise<Tax | null> {
          setLoading();
          try {
            const cached = findCachedEntityById(store.tax().catalog, id);
            if (cached && store.tax().catalogLoaded) {
              selectTax(cached);
              return cached;
            }
            if (store.tax().catalogLoaded) {
              selectTax(null);
              return null;
            }
            const tax = await service.getById(id);
            cacheCatalogEntry(tax);
            selectTax(tax);
            return tax;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load tax.'));
            return null;
          }
        },
        async loadTaxes(query?: TaxListQuery): Promise<void> {
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
            setError(getApiErrorMessage(error, 'Failed to load taxes.'));
          }
        },
        async refreshTaxes(query?: TaxListQuery): Promise<void> {
          setLoading();
          try {
            const cacheReady = await ensureCatalogLoaded(true);
            if (cacheReady) {
              applyViewQuery(query);
              return;
            }
            await loadFromApi(query);
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load taxes.'));
          }
        },
        async updateTax(id: string, payload: TaxPayload): Promise<boolean> {
          setLoading();
          try {
            const updated = await service.update(id, payload);
            const mergeEntry = (entry: Tax): Tax =>
              entry.id === id ? { ...entry, ...payload, ...updated } : entry;
            if (store.tax().catalogLoaded) {
              patchState(store, (state) => ({
                tax: {
                  ...state.tax,
                  catalog: updateCachedEntityById(state.tax.catalog, id, mergeEntry),
                  selectedItem:
                    state.tax.selectedItem?.id === id
                      ? mergeEntry(state.tax.selectedItem)
                      : state.tax.selectedItem,
                },
              }));
              reapplyCachedView();
              void catalogCacheStore.persistCatalog(CACHE_NAME, store.tax().catalog);
            } else {
              patchState(store, (state) => ({
                tax: {
                  ...state.tax,
                  error: null,
                  isLoading: false,
                  items: state.tax.items.map(mergeEntry),
                  selectedItem:
                    state.tax.selectedItem?.id === id
                      ? mergeEntry(state.tax.selectedItem)
                      : state.tax.selectedItem,
                },
              }));
            }
            return true;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to update tax.'));
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
