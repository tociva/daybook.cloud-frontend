import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import type {
  PurchaseReturn,
  PurchaseReturnGetQuery,
  PurchaseReturnListQuery,
  PurchaseReturnPayload,
} from './purchase-return.model';
import { PurchaseReturnService } from './purchase-return.service';
import { initialPurchaseReturnState } from './purchase-return.state';

export const PurchaseReturnStore = signalStore(
  { providedIn: 'root' },
  withState(initialPurchaseReturnState),
  withComputed(({ purchaseReturn }) => ({
    count: computed(() => purchaseReturn().count),
    error: computed(() => purchaseReturn().error),
    isLoading: computed(() => purchaseReturn().isLoading),
    items: computed(() => purchaseReturn().items),
    selectedItem: computed(() => purchaseReturn().selectedItem),
  })),
  withMethods((store, service = inject(PurchaseReturnService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        purchaseReturn: { ...state.purchaseReturn, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        purchaseReturn: { ...state.purchaseReturn, error, isLoading: false },
      }));
    };

    return {
      clearError(): void {
        patchState(store, (state) => ({
          purchaseReturn: { ...state.purchaseReturn, error: null },
        }));
      },

      clearSelectedItem(): void {
        patchState(store, (state) => ({
          purchaseReturn: { ...state.purchaseReturn, selectedItem: null },
        }));
      },

      setSelectedItem(ret: PurchaseReturn): void {
        patchState(store, (state) => ({
          purchaseReturn: { ...state.purchaseReturn, selectedItem: ret },
        }));
      },

      async createPurchaseReturn(payload: PurchaseReturnPayload): Promise<PurchaseReturn | null> {
        setLoading();
        try {
          const ret = await service.create(payload);
          patchState(store, (state) => ({
            purchaseReturn: {
              ...state.purchaseReturn,
              count: state.purchaseReturn.count + 1,
              error: null,
              isLoading: false,
              items: [ret, ...state.purchaseReturn.items],
              selectedItem: ret,
            },
          }));
          return ret;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to create purchase return.'));
          return null;
        }
      },

      async deletePurchaseReturn(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            purchaseReturn: {
              ...state.purchaseReturn,
              count: Math.max(state.purchaseReturn.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.purchaseReturn.items.filter((r) => r.id !== id),
              selectedItem:
                state.purchaseReturn.selectedItem?.id === id
                  ? null
                  : state.purchaseReturn.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to delete purchase return.'));
          return false;
        }
      },

      async loadPurchaseReturnById(
        id: string,
        query?: PurchaseReturnGetQuery,
      ): Promise<PurchaseReturn | null> {
        setLoading();
        try {
          const ret = await service.getById(id, query);
          patchState(store, (state) => ({
            purchaseReturn: {
              ...state.purchaseReturn,
              error: null,
              isLoading: false,
              selectedItem: ret,
            },
          }));
          return ret;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load purchase return.'));
          return null;
        }
      },

      async loadPurchaseReturns(query: PurchaseReturnListQuery = {}): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            purchaseReturn: {
              ...state.purchaseReturn,
              count,
              error: null,
              isLoading: false,
              items,
            },
          }));
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load purchase returns.'));
        }
      },

      async updatePurchaseReturn(id: string, payload: PurchaseReturnPayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          patchState(store, (state) => ({
            purchaseReturn: {
              ...state.purchaseReturn,
              error: null,
              isLoading: false,
            },
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update purchase return.'));
          return false;
        }
      },
    };
  }),
);
