import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import type {
  InventoryLedgerMap,
  InventoryLedgerMapGetQuery,
  InventoryLedgerMapListQuery,
  InventoryLedgerMapPayload,
} from './inventory-ledger-map.model';
import { InventoryLedgerMapService } from './inventory-ledger-map.service';
import { initialInventoryLedgerMapState } from './inventory-ledger-map.state';

export const InventoryLedgerMapStore = signalStore(
  { providedIn: 'root' },
  withState(initialInventoryLedgerMapState),
  withComputed(({ inventoryLedgerMap }) => ({
    count: computed(() => inventoryLedgerMap().count),
    error: computed(() => inventoryLedgerMap().error),
    isLoading: computed(() => inventoryLedgerMap().isLoading),
    items: computed(() => inventoryLedgerMap().items),
    selectedItem: computed(() => inventoryLedgerMap().selectedItem),
  })),
  withMethods((store, service = inject(InventoryLedgerMapService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        inventoryLedgerMap: { ...state.inventoryLedgerMap, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        inventoryLedgerMap: { ...state.inventoryLedgerMap, error, isLoading: false },
      }));
    };

    return {
      clearError(): void {
        patchState(store, (state) => ({
          inventoryLedgerMap: { ...state.inventoryLedgerMap, error: null },
        }));
      },

      clearSelectedItem(): void {
        patchState(store, (state) => ({
          inventoryLedgerMap: { ...state.inventoryLedgerMap, selectedItem: null },
        }));
      },

      setSelectedItem(item: InventoryLedgerMap): void {
        patchState(store, (state) => ({
          inventoryLedgerMap: { ...state.inventoryLedgerMap, selectedItem: item },
        }));
      },

      async createInventoryLedgerMap(
        payload: InventoryLedgerMapPayload,
      ): Promise<InventoryLedgerMap | null> {
        setLoading();
        try {
          const item = await service.create(payload);
          patchState(store, (state) => ({
            inventoryLedgerMap: {
              ...state.inventoryLedgerMap,
              count: state.inventoryLedgerMap.count + 1,
              error: null,
              isLoading: false,
              items: [item, ...state.inventoryLedgerMap.items],
              selectedItem: item,
            },
          }));
          return item;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to create inventory ledger mapping.'));
          return null;
        }
      },

      async deleteInventoryLedgerMap(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            inventoryLedgerMap: {
              ...state.inventoryLedgerMap,
              count: Math.max(state.inventoryLedgerMap.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.inventoryLedgerMap.items.filter((item) => item.id !== id),
              selectedItem:
                state.inventoryLedgerMap.selectedItem?.id === id
                  ? null
                  : state.inventoryLedgerMap.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to delete inventory ledger mapping.'));
          return false;
        }
      },

      async loadInventoryLedgerMapById(
        id: string,
        query?: InventoryLedgerMapGetQuery,
      ): Promise<InventoryLedgerMap | null> {
        setLoading();
        try {
          const item = await service.getById(id, query);
          patchState(store, (state) => ({
            inventoryLedgerMap: {
              ...state.inventoryLedgerMap,
              error: null,
              isLoading: false,
              selectedItem: item,
            },
          }));
          return item;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load inventory ledger mapping.'));
          return null;
        }
      },

      async loadInventoryLedgerMaps(query: InventoryLedgerMapListQuery = {}): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            inventoryLedgerMap: {
              ...state.inventoryLedgerMap,
              count,
              error: null,
              isLoading: false,
              items,
            },
          }));
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load inventory ledger mappings.'));
        }
      },

      async updateInventoryLedgerMap(
        id: string,
        payload: InventoryLedgerMapPayload,
      ): Promise<boolean> {
        setLoading();
        try {
          const updated = await service.update(id, payload);
          patchState(store, (state) => {
            const mergeItem = (item: InventoryLedgerMap): InventoryLedgerMap =>
              item.id === id ? { ...item, ...payload, ...updated } : item;

            return {
              inventoryLedgerMap: {
                ...state.inventoryLedgerMap,
                error: null,
                isLoading: false,
                items: state.inventoryLedgerMap.items.map(mergeItem),
                selectedItem:
                  state.inventoryLedgerMap.selectedItem?.id === id
                    ? mergeItem(state.inventoryLedgerMap.selectedItem)
                    : state.inventoryLedgerMap.selectedItem,
              },
            };
          });
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update inventory ledger mapping.'));
          return false;
        }
      },
    };
  }),
);

