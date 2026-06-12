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
import type {
  Customer,
  CustomerGetQuery,
  CustomerListQuery,
  CustomerPayload,
} from './customer.model';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import { applyCustomerListQuery } from './customer.query';
import { CustomerService } from './customer.service';
import { initialCustomerState } from './customer.state';

const hasUnsupportedIncludes = (query?: CustomerGetQuery): boolean =>
  (query?.includes?.length ?? 0) > 0;
const CACHE_NAME = 'customers';

export const CustomerStore = signalStore(
  { providedIn: 'root' },
  withState(initialCustomerState),
  withComputed(({ customer }) => ({
    catalog: computed(() => customer().catalog),
    catalogLoaded: computed(() => customer().catalogLoaded),
    catalogTotalCount: computed(() => customer().catalogTotalCount),
    count: computed(() => customer().count),
    error: computed(() => customer().error),
    isLoading: computed(() => customer().isLoading),
    items: computed(() => customer().items),
    selectedItem: computed(() => customer().selectedItem),
  })),
  withMethods(
    (
      store,
      service = inject(CustomerService),
      catalogCacheStore = inject(CatalogCacheService),
      cachePrefs = inject(LedgerCachePreferencesStore),
    ) => {
      let activeViewQuery: CustomerListQuery | undefined;

      const setLoading = (): void => {
        patchState(store, (state) => ({
          customer: { ...state.customer, error: null, isLoading: true },
        }));
      };

      const setError = (error: string): void => {
        patchState(store, (state) => ({
          customer: { ...state.customer, error, isLoading: false },
        }));
      };

      const clearCatalogState = (): void => {
        catalogCache.clearPendingLoad();
        activeViewQuery = undefined;
        patchState(store, (state) => ({
          customer: {
            ...state.customer,
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

      const applyViewQuery = (query?: CustomerListQuery): void => {
        activeViewQuery = query;
        const { items, count } = applyCustomerListQuery(store.customer().catalog, query);
        patchState(store, (state) => ({
          customer: { ...state.customer, count, error: null, isLoading: false, items },
        }));
      };

      const fetchFullCatalog = async (): Promise<readonly Customer[]> => {
        const total = await service.count({});
        if (total === 0) return [];
        return service.list({ limit: total, offset: 0 });
      };

      const saveCatalog = (catalog: readonly Customer[]): void => {
        patchState(store, (state) => ({
          customer: {
            ...state.customer,
            catalog,
            catalogLoaded: true,
            catalogTotalCount: catalog.length,
            error: null,
          },
        }));
      };

      const catalogCache = createCachedCrudLoader<Customer>({
        canLoadCatalog: () => catalogCacheStore.currentScope() !== null,
        clearCatalog: () => catalogCacheStore.clearCatalog(CACHE_NAME),
        fetchCatalog: fetchFullCatalog,
        isEnabled: () => cachePrefs.enabled(),
        isLoaded: () => store.customer().catalogLoaded,
        loadCatalog: () => catalogCacheStore.loadCatalog<Customer>(CACHE_NAME),
        persistCatalog: (catalog) => catalogCacheStore.persistCatalog(CACHE_NAME, catalog),
        saveCatalog,
      });

      const ensureCatalogLoaded = async (forceReload = false): Promise<boolean> => {
        if (!cachePrefs.enabled()) return false;
        if (forceReload) clearCatalogState();
        return catalogCache.ensureLoaded();
      };

      const cacheCatalogEntry = (customer: Customer): void => {
        if (!cachePrefs.enabled()) return;

        patchState(store, (state) => ({
          customer: {
            ...state.customer,
            catalog: upsertCachedEntity(state.customer.catalog, customer),
          },
        }));
        void catalogCacheStore.persistCatalog(CACHE_NAME, store.customer().catalog);
      };

      const selectCustomer = (customer: Customer | null): void => {
        patchState(store, (state) => ({
          customer: { ...state.customer, error: null, isLoading: false, selectedItem: customer },
        }));
      };

      const loadFromApi = async (query?: CustomerListQuery): Promise<void> => {
        activeViewQuery = query;
        const [items, count] = await Promise.all([service.list(query), service.count(query)]);
        patchState(store, (state) => ({
          customer: { ...state.customer, count, error: null, isLoading: false, items },
        }));
      };

      const reapplyCachedView = (): void => applyViewQuery(activeViewQuery);

      return {
        clearCatalog(): void {
          clearCatalogState();
        },
        clearError(): void {
          patchState(store, (state) => ({
            customer: { ...state.customer, error: null },
          }));
        },
        clearSelectedItem(): void {
          patchState(store, (state) => ({
            customer: { ...state.customer, selectedItem: null },
          }));
        },
        setSelectedItem(customer: Customer): void {
          patchState(store, (state) => ({
            customer: { ...state.customer, selectedItem: customer },
          }));
        },
        async ensureCustomerCatalogLoaded(forceReload = false): Promise<boolean> {
          setLoading();
          try {
            const loaded = await ensureCatalogLoaded(forceReload);
            patchState(store, (state) => ({
              customer: { ...state.customer, error: null, isLoading: false },
            }));
            return loaded;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load customers.'));
            return false;
          }
        },
        async refreshCustomerCatalog(): Promise<boolean> {
          return ensureCatalogLoaded(true);
        },
        async createCustomer(payload: CustomerPayload): Promise<Customer | null> {
          setLoading();
          try {
            const customer = await service.create(payload);
            if (store.customer().catalogLoaded) {
              patchState(store, (state) => ({
                customer: {
                  ...state.customer,
                  catalog: upsertCachedEntity(state.customer.catalog, customer),
                  catalogTotalCount: state.customer.catalogTotalCount + 1,
                  selectedItem: customer,
                },
              }));
              reapplyCachedView();
              void catalogCacheStore.persistCatalog(CACHE_NAME, store.customer().catalog);
            } else {
              patchState(store, (state) => ({
                customer: {
                  ...state.customer,
                  count: state.customer.count + 1,
                  error: null,
                  isLoading: false,
                  items: [customer, ...state.customer.items],
                  selectedItem: customer,
                },
              }));
            }
            return customer;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to create customer.'));
            return null;
          }
        },
        async deleteCustomer(id: string): Promise<boolean> {
          setLoading();
          try {
            await service.delete(id);
            if (store.customer().catalogLoaded) {
              patchState(store, (state) => ({
                customer: {
                  ...state.customer,
                  catalog: removeCachedEntityById(state.customer.catalog, id),
                  catalogTotalCount: Math.max(state.customer.catalogTotalCount - 1, 0),
                  selectedItem:
                    state.customer.selectedItem?.id === id ? null : state.customer.selectedItem,
                },
              }));
              reapplyCachedView();
              void catalogCacheStore.persistCatalog(CACHE_NAME, store.customer().catalog);
            } else {
              patchState(store, (state) => ({
                customer: {
                  ...state.customer,
                  count: Math.max(state.customer.count - 1, 0),
                  error: null,
                  isLoading: false,
                  items: state.customer.items.filter((customer) => customer.id !== id),
                  selectedItem:
                    state.customer.selectedItem?.id === id ? null : state.customer.selectedItem,
                },
              }));
            }
            return true;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to delete customer.'));
            return false;
          }
        },
        async loadCustomerById(id: string, query?: CustomerGetQuery): Promise<Customer | null> {
          setLoading();
          try {
            const cached = findCachedEntityById(store.customer().catalog, id);
            if (cached && store.customer().catalogLoaded && !hasUnsupportedIncludes(query)) {
              selectCustomer(cached);
              return cached;
            }
            if (store.customer().catalogLoaded && !hasUnsupportedIncludes(query)) {
              selectCustomer(null);
              return null;
            }
            const customer = await service.getById(id, query);
            cacheCatalogEntry(customer);
            selectCustomer(customer);
            return customer;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load customer.'));
            return null;
          }
        },
        async loadCustomers(query?: CustomerListQuery): Promise<void> {
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
            setError(getApiErrorMessage(error, 'Failed to load customers.'));
          }
        },
        async refreshCustomers(query?: CustomerListQuery): Promise<void> {
          setLoading();
          try {
            const cacheReady = await ensureCatalogLoaded(true);
            if (cacheReady) {
              applyViewQuery(query);
              return;
            }
            await loadFromApi(query);
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to load customers.'));
          }
        },
        async updateCustomer(id: string, payload: CustomerPayload): Promise<boolean> {
          setLoading();
          try {
            const updated = await service.update(id, payload);
            const mergeEntry = (entry: Customer): Customer =>
              entry.id === id ? { ...entry, ...payload, ...updated } : entry;
            if (store.customer().catalogLoaded) {
              patchState(store, (state) => ({
                customer: {
                  ...state.customer,
                  catalog: updateCachedEntityById(state.customer.catalog, id, mergeEntry),
                  selectedItem:
                    state.customer.selectedItem?.id === id
                      ? mergeEntry(state.customer.selectedItem)
                      : state.customer.selectedItem,
                },
              }));
              reapplyCachedView();
              void catalogCacheStore.persistCatalog(CACHE_NAME, store.customer().catalog);
            } else {
              patchState(store, (state) => ({
                customer: {
                  ...state.customer,
                  error: null,
                  isLoading: false,
                  items: state.customer.items.map(mergeEntry),
                  selectedItem:
                    state.customer.selectedItem?.id === id
                      ? mergeEntry(state.customer.selectedItem)
                      : state.customer.selectedItem,
                },
              }));
            }
            return true;
          } catch (error) {
            setError(getApiErrorMessage(error, 'Failed to update customer.'));
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
