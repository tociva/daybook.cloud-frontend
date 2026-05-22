import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import type {
  Customer,
  CustomerGetQuery,
  CustomerListQuery,
  CustomerPayload,
} from './customer.model';
import { CustomerService } from './customer.service';
import { initialCustomerState } from './customer.state';

export const CustomerStore = signalStore(
  { providedIn: 'root' },
  withState(initialCustomerState),
  withComputed(({ customer }) => ({
    count: computed(() => customer().count),
    error: computed(() => customer().error),
    isLoading: computed(() => customer().isLoading),
    items: computed(() => customer().items),
    selectedItem: computed(() => customer().selectedItem),
  })),
  withMethods((store, service = inject(CustomerService)) => {
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

    return {
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

      async createCustomer(payload: CustomerPayload): Promise<Customer | null> {
        setLoading();
        try {
          const customer = await service.create(payload);
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
          patchState(store, (state) => ({
            customer: {
              ...state.customer,
              count: Math.max(state.customer.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.customer.items.filter((c) => c.id !== id),
              selectedItem:
                state.customer.selectedItem?.id === id ? null : state.customer.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to delete customer.'));
          return false;
        }
      },

      async loadCustomerById(id: string, query?: CustomerGetQuery): Promise<Customer | null> {
        setLoading();
        try {
          const customer = await service.getById(id, query);
          patchState(store, (state) => ({
            customer: { ...state.customer, error: null, isLoading: false, selectedItem: customer },
          }));
          return customer;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load customer.'));
          return null;
        }
      },

      async loadCustomers(query: CustomerListQuery = {}): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            customer: { ...state.customer, count, error: null, isLoading: false, items },
          }));
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load customers.'));
        }
      },

      async updateCustomer(id: string, payload: CustomerPayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          patchState(store, (state) => {
            const existing = state.customer.items.find((item) => item.id === id);
            const mergedItem = existing ? { ...existing, ...payload } : state.customer.selectedItem;
            return {
              customer: {
                ...state.customer,
                error: null,
                isLoading: false,
                items: state.customer.items.map((item) =>
                  item.id === id ? { ...item, ...payload } : item,
                ),
                selectedItem: mergedItem,
              },
            };
          });
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update customer.'));
          return false;
        }
      },
    };
  }),
);
