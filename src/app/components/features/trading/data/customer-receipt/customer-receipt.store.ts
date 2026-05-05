import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type {
  CustomerReceipt,
  CustomerReceiptGetQuery,
  CustomerReceiptListQuery,
  CustomerReceiptPayload,
} from './customer-receipt.model';
import { CustomerReceiptService } from './customer-receipt.service';
import { initialCustomerReceiptState } from './customer-receipt.state';

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const CustomerReceiptStore = signalStore(
  { providedIn: 'root' },
  withState(initialCustomerReceiptState),
  withComputed(({ customerReceipt }) => ({
    count: computed(() => customerReceipt().count),
    error: computed(() => customerReceipt().error),
    isLoading: computed(() => customerReceipt().isLoading),
    items: computed(() => customerReceipt().items),
    selectedItem: computed(() => customerReceipt().selectedItem),
  })),
  withMethods((store, service = inject(CustomerReceiptService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        customerReceipt: { ...state.customerReceipt, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        customerReceipt: { ...state.customerReceipt, error, isLoading: false },
      }));
    };

    return {
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          customerReceipt: { ...state.customerReceipt, selectedItem: null },
        }));
      },

      async createCustomerReceipt(
        payload: CustomerReceiptPayload,
      ): Promise<CustomerReceipt | null> {
        setLoading();
        try {
          const receipt = await service.create(payload);
          patchState(store, (state) => ({
            customerReceipt: {
              ...state.customerReceipt,
              count: state.customerReceipt.count + 1,
              error: null,
              isLoading: false,
              items: [receipt, ...state.customerReceipt.items],
              selectedItem: receipt,
            },
          }));
          return receipt;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to create customer receipt.'));
          return null;
        }
      },

      async deleteCustomerReceipt(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            customerReceipt: {
              ...state.customerReceipt,
              count: Math.max(state.customerReceipt.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.customerReceipt.items.filter((r) => r.id !== id),
              selectedItem:
                state.customerReceipt.selectedItem?.id === id
                  ? null
                  : state.customerReceipt.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to delete customer receipt.'));
          return false;
        }
      },

      async loadCustomerReceiptById(
        id: string,
        query?: CustomerReceiptGetQuery,
      ): Promise<CustomerReceipt | null> {
        setLoading();
        try {
          const receipt = await service.getById(id, query);
          patchState(store, (state) => ({
            customerReceipt: {
              ...state.customerReceipt,
              error: null,
              isLoading: false,
              selectedItem: receipt,
            },
          }));
          return receipt;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load customer receipt.'));
          return null;
        }
      },

      async loadCustomerReceipts(query: CustomerReceiptListQuery = {}): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            customerReceipt: {
              ...state.customerReceipt,
              count,
              error: null,
              isLoading: false,
              items,
            },
          }));
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load customer receipts.'));
        }
      },

      async updateCustomerReceipt(
        id: string,
        payload: CustomerReceiptPayload,
      ): Promise<CustomerReceipt | null> {
        setLoading();
        try {
          const receipt = await service.update(id, payload);
          patchState(store, (state) => ({
            customerReceipt: {
              ...state.customerReceipt,
              error: null,
              isLoading: false,
              items: state.customerReceipt.items.map((r) => (r.id === id ? receipt : r)),
              selectedItem: receipt,
            },
          }));
          return receipt;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to update customer receipt.'));
          return null;
        }
      },
    };
  }),
);
