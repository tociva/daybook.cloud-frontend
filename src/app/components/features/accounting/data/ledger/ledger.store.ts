import { computed, effect, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import { LedgerCachePreferencesStore } from '../../../../../core/preferences/ledger-cache-preferences.store';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import type { Ledger, LedgerGetQuery, LedgerListQuery, LedgerPayload } from './ledger.model';
import { applyLedgerListQuery } from './ledger.query';
import { LedgerService } from './ledger.service';
import { initialLedgerState } from './ledger.state';

const CATALOG_INCLUDES = ['category'] as const;

export const LedgerStore = signalStore(
  { providedIn: 'root' },
  withState(initialLedgerState),
  withComputed(({ ledger }) => ({
    catalogTotalCount: computed(() => ledger().catalogTotalCount),
    count: computed(() => ledger().count),
    error: computed(() => ledger().error),
    isLoading: computed(() => ledger().isLoading),
    items: computed(() => ledger().items),
    selectedItem: computed(() => ledger().selectedItem),
  })),
  withMethods((store, service = inject(LedgerService), cachePrefs = inject(LedgerCachePreferencesStore)) => {
    let catalogLoadPromise: Promise<void> | null = null;

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

    const mergeLedgerIntoCatalog = (
      catalog: readonly Ledger[],
      ledger: Ledger,
    ): readonly Ledger[] => {
      if (!ledger.id) return [ledger, ...catalog];
      const existingIndex = catalog.findIndex((entry) => entry.id === ledger.id);
      if (existingIndex === -1) return [ledger, ...catalog];
      return catalog.map((entry, index) => (index === existingIndex ? { ...entry, ...ledger } : entry));
    };

    const upsertCatalogEntry = (ledger: Ledger, deltaCount = 0): void => {
      patchState(store, (state) => ({
        ledger: {
          ...state.ledger,
          catalog: mergeLedgerIntoCatalog(state.ledger.catalog, ledger),
          catalogLoaded: state.ledger.catalogLoaded || cachePrefs.enabled(),
          catalogTotalCount: Math.max(0, state.ledger.catalogTotalCount + deltaCount),
        },
      }));
    };

    const applyViewQuery = (query?: LedgerListQuery): void => {
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

    const ensureCatalogLoaded = async (): Promise<void> => {
      if (!cachePrefs.enabled()) return;
      if (store.ledger().catalogLoaded) return;

      if (catalogLoadPromise) {
        await catalogLoadPromise;
        return;
      }

      catalogLoadPromise = (async () => {
        const catalog = await fetchFullCatalog();
        patchState(store, (state) => ({
          ledger: {
            ...state.ledger,
            catalog,
            catalogLoaded: true,
            catalogTotalCount: catalog.length,
            error: null,
          },
        }));
      })();

      try {
        await catalogLoadPromise;
      } finally {
        catalogLoadPromise = null;
      }
    };

    const loadLedgersFromApi = async (query?: LedgerListQuery): Promise<void> => {
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
      patchState(store, (state) => ({
        ledger: {
          ...state.ledger,
          error: null,
          isLoading: false,
          selectedItem: item,
        },
      }));
      return item;
    };

    return {
      clearCatalog(): void {
        catalogLoadPromise = null;
        patchState(store, (state) => ({
          ledger: {
            ...state.ledger,
            catalog: [],
            catalogLoaded: false,
            catalogTotalCount: 0,
          },
        }));
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

      async createLedger(payload: LedgerPayload): Promise<Ledger | null> {
        setLoading();
        try {
          const item = await service.create(payload);
          patchState(store, (state) => {
            const catalog = cachePrefs.enabled()
              ? mergeLedgerIntoCatalog(state.ledger.catalog, item)
              : state.ledger.catalog;
            return {
              ledger: {
                ...state.ledger,
                catalog,
                catalogTotalCount: cachePrefs.enabled()
                  ? state.ledger.catalogTotalCount + 1
                  : state.ledger.catalogTotalCount,
                catalogLoaded: state.ledger.catalogLoaded || cachePrefs.enabled(),
                count: state.ledger.count + 1,
                error: null,
                isLoading: false,
                items: [item, ...state.ledger.items],
                selectedItem: item,
              },
            };
          });
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
          patchState(store, (state) => ({
            ledger: {
              ...state.ledger,
              catalog: cachePrefs.enabled()
                ? state.ledger.catalog.filter((entry) => entry.id !== id)
                : state.ledger.catalog,
              catalogTotalCount: cachePrefs.enabled()
                ? Math.max(state.ledger.catalogTotalCount - 1, 0)
                : state.ledger.catalogTotalCount,
              count: Math.max(state.ledger.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.ledger.items.filter((entry) => entry.id !== id),
              selectedItem: state.ledger.selectedItem?.id === id ? null : state.ledger.selectedItem,
            },
          }));
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

          await ensureCatalogLoaded();
          const cached = store.ledger().catalog.find((entry) => entry.id === id);
          if (cached) {
            patchState(store, (state) => ({
              ledger: { ...state.ledger, error: null, isLoading: false, selectedItem: cached },
            }));
            return cached;
          }

          const item = await service.getById(id, query);
          upsertCatalogEntry(item);
          patchState(store, (state) => ({
            ledger: { ...state.ledger, error: null, isLoading: false, selectedItem: item },
          }));
          return item;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load ledger.'));
          return null;
        }
      },

      async loadLedgers(query?: LedgerListQuery): Promise<void> {
        setLoading();
        try {
          if (!cachePrefs.enabled()) {
            await loadLedgersFromApi(query);
            return;
          }

          await ensureCatalogLoaded();
          applyViewQuery(query);
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load ledgers.'));
        }
      },

      async updateLedger(id: string, payload: LedgerPayload): Promise<boolean> {
        setLoading();
        try {
          const updated = await service.update(id, payload);
          patchState(store, (state) => {
            const mergeEntry = (entry: Ledger): Ledger =>
              entry.id === id ? { ...entry, ...payload, ...updated } : entry;

            return {
              ledger: {
                ...state.ledger,
                catalog: cachePrefs.enabled()
                  ? state.ledger.catalog.map(mergeEntry)
                  : state.ledger.catalog,
                error: null,
                isLoading: false,
                items: state.ledger.items.map(mergeEntry),
                selectedItem:
                  state.ledger.selectedItem?.id === id
                    ? mergeEntry(state.ledger.selectedItem)
                    : state.ledger.selectedItem,
              },
            };
          });
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update ledger.'));
          return false;
        }
      },
    };
  }),
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
