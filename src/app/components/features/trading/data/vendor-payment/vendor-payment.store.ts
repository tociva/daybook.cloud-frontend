import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type {
  VendorPayment,
  VendorPaymentGetQuery,
  VendorPaymentListQuery,
  VendorPaymentPayload,
} from './vendor-payment.model';
import { VendorPaymentService } from './vendor-payment.service';
import { initialVendorPaymentState } from './vendor-payment.state';

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const VendorPaymentStore = signalStore(
  { providedIn: 'root' },
  withState(initialVendorPaymentState),
  withComputed(({ vendorPayment }) => ({
    count: computed(() => vendorPayment().count),
    error: computed(() => vendorPayment().error),
    isLoading: computed(() => vendorPayment().isLoading),
    items: computed(() => vendorPayment().items),
    selectedItem: computed(() => vendorPayment().selectedItem),
  })),
  withMethods((store, service = inject(VendorPaymentService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        vendorPayment: { ...state.vendorPayment, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        vendorPayment: { ...state.vendorPayment, error, isLoading: false },
      }));
    };

    return {
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          vendorPayment: { ...state.vendorPayment, selectedItem: null },
        }));
      },

      async createVendorPayment(payload: VendorPaymentPayload): Promise<VendorPayment | null> {
        setLoading();
        try {
          const payment = await service.create(payload);
          patchState(store, (state) => ({
            vendorPayment: {
              ...state.vendorPayment,
              count: state.vendorPayment.count + 1,
              error: null,
              isLoading: false,
              items: [payment, ...state.vendorPayment.items],
              selectedItem: payment,
            },
          }));
          return payment;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to create vendor payment.'));
          return null;
        }
      },

      async deleteVendorPayment(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            vendorPayment: {
              ...state.vendorPayment,
              count: Math.max(state.vendorPayment.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.vendorPayment.items.filter((p) => p.id !== id),
              selectedItem:
                state.vendorPayment.selectedItem?.id === id
                  ? null
                  : state.vendorPayment.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to delete vendor payment.'));
          return false;
        }
      },

      async loadVendorPaymentById(
        id: string,
        query?: VendorPaymentGetQuery,
      ): Promise<VendorPayment | null> {
        setLoading();
        try {
          const payment = await service.getById(id, query);
          patchState(store, (state) => ({
            vendorPayment: {
              ...state.vendorPayment,
              error: null,
              isLoading: false,
              selectedItem: payment,
            },
          }));
          return payment;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load vendor payment.'));
          return null;
        }
      },

      async loadVendorPayments(query: VendorPaymentListQuery = {}): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            vendorPayment: {
              ...state.vendorPayment,
              count,
              error: null,
              isLoading: false,
              items,
            },
          }));
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load vendor payments.'));
        }
      },

      async updateVendorPayment(id: string, payload: VendorPaymentPayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          patchState(store, (state) => {
            const existing = state.vendorPayment.items.find((item) => item.id === id);
            const mergedItem = existing
              ? { ...existing, ...payload }
              : state.vendorPayment.selectedItem;
            return {
              vendorPayment: {
                ...state.vendorPayment,
                error: null,
                isLoading: false,
                items: state.vendorPayment.items.map((item) =>
                  item.id === id ? { ...item, ...payload } : item,
                ),
                selectedItem: mergedItem,
              },
            };
          });
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to update vendor payment.'));
          return false;
        }
      },
    };
  }),
);
