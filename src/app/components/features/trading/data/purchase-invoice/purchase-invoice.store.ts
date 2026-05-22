import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import type {
  PurchaseInvoice,
  PurchaseInvoiceGetQuery,
  PurchaseInvoiceListQuery,
  PurchaseInvoicePayload,
} from './purchase-invoice.model';
import { PurchaseInvoiceService } from './purchase-invoice.service';
import { initialPurchaseInvoiceState } from './purchase-invoice.state';

export const PurchaseInvoiceStore = signalStore(
  { providedIn: 'root' },
  withState(initialPurchaseInvoiceState),
  withComputed(({ purchaseInvoice }) => ({
    count: computed(() => purchaseInvoice().count),
    error: computed(() => purchaseInvoice().error),
    isLoading: computed(() => purchaseInvoice().isLoading),
    items: computed(() => purchaseInvoice().items),
    selectedItem: computed(() => purchaseInvoice().selectedItem),
  })),
  withMethods((store, service = inject(PurchaseInvoiceService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        purchaseInvoice: { ...state.purchaseInvoice, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        purchaseInvoice: { ...state.purchaseInvoice, error, isLoading: false },
      }));
    };

    return {
      clearError(): void {
        patchState(store, (state) => ({
          purchaseInvoice: { ...state.purchaseInvoice, error: null },
        }));
      },
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          purchaseInvoice: { ...state.purchaseInvoice, selectedItem: null },
        }));
      },

      setSelectedItem(invoice: PurchaseInvoice): void {
        patchState(store, (state) => ({
          purchaseInvoice: { ...state.purchaseInvoice, selectedItem: invoice },
        }));
      },

      async createPurchaseInvoice(
        payload: PurchaseInvoicePayload,
      ): Promise<PurchaseInvoice | null> {
        setLoading();
        try {
          const invoice = await service.create(payload);
          patchState(store, (state) => ({
            purchaseInvoice: {
              ...state.purchaseInvoice,
              count: state.purchaseInvoice.count + 1,
              error: null,
              isLoading: false,
              items: [invoice, ...state.purchaseInvoice.items],
              selectedItem: invoice,
            },
          }));
          return invoice;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to create purchase invoice.'));
          return null;
        }
      },

      async deletePurchaseInvoice(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            purchaseInvoice: {
              ...state.purchaseInvoice,
              count: Math.max(state.purchaseInvoice.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.purchaseInvoice.items.filter((inv) => inv.id !== id),
              selectedItem:
                state.purchaseInvoice.selectedItem?.id === id
                  ? null
                  : state.purchaseInvoice.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to delete purchase invoice.'));
          return false;
        }
      },

      async loadPurchaseInvoiceById(
        id: string,
        query?: PurchaseInvoiceGetQuery,
      ): Promise<PurchaseInvoice | null> {
        setLoading();
        try {
          const invoice = await service.getById(id, query);
          patchState(store, (state) => ({
            purchaseInvoice: {
              ...state.purchaseInvoice,
              error: null,
              isLoading: false,
              selectedItem: invoice,
            },
          }));
          return invoice;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load purchase invoice.'));
          return null;
        }
      },

      async loadPurchaseInvoices(query: PurchaseInvoiceListQuery = {}): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            purchaseInvoice: {
              ...state.purchaseInvoice,
              count,
              error: null,
              isLoading: false,
              items,
            },
          }));
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load purchase invoices.'));
        }
      },

      async updatePurchaseInvoice(id: string, payload: PurchaseInvoicePayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          patchState(store, (state) => ({
            purchaseInvoice: {
              ...state.purchaseInvoice,
              error: null,
              isLoading: false,
            },
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update purchase invoice.'));
          return false;
        }
      },
    };
  }),
);
