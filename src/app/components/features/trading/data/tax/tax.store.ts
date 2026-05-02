import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { Tax, TaxListQuery, TaxPayload } from './tax.model';
import { TaxService } from './tax.service';
import { initialTaxState } from './tax.state';

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const TaxStore = signalStore(
  { providedIn: 'root' },
  withState(initialTaxState),
  withComputed(({ tax }) => ({
    count: computed(() => tax().count),
    error: computed(() => tax().error),
    isLoading: computed(() => tax().isLoading),
    items: computed(() => tax().items),
    selectedItem: computed(() => tax().selectedItem),
  })),
  withMethods((store, service = inject(TaxService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        tax: {
          ...state.tax,
          error: null,
          isLoading: true,
        },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        tax: {
          ...state.tax,
          error,
          isLoading: false,
        },
      }));
    };

    return {
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          tax: {
            ...state.tax,
            selectedItem: null,
          },
        }));
      },
      async createTax(payload: TaxPayload): Promise<Tax | null> {
        setLoading();

        try {
          const tax = await service.create(payload);
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

          return tax;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to create tax.'));
          return null;
        }
      },
      async deleteTax(id: string): Promise<boolean> {
        setLoading();

        try {
          await service.delete(id);
          patchState(store, (state) => ({
            tax: {
              ...state.tax,
              count: Math.max(state.tax.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.tax.items.filter((item) => item.id !== id),
              selectedItem: state.tax.selectedItem?.id === id ? null : state.tax.selectedItem,
            },
          }));

          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to delete tax.'));
          return false;
        }
      },
      async loadTaxById(id: string): Promise<Tax | null> {
        setLoading();

        try {
          const tax = await service.getById(id);
          patchState(store, (state) => ({
            tax: {
              ...state.tax,
              error: null,
              isLoading: false,
              selectedItem: tax,
            },
          }));

          return tax;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load tax.'));
          return null;
        }
      },
      async loadTaxes(query?: TaxListQuery): Promise<void> {
        setLoading();

        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            tax: {
              ...state.tax,
              count,
              error: null,
              isLoading: false,
              items,
            },
          }));
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load taxes.'));
        }
      },
      async updateTax(id: string, payload: TaxPayload): Promise<Tax | null> {
        setLoading();

        try {
          const tax = await service.update(id, payload);
          patchState(store, (state) => ({
            tax: {
              ...state.tax,
              error: null,
              isLoading: false,
              items: state.tax.items.map((item) => (item.id === id ? tax : item)),
              selectedItem: tax,
            },
          }));

          return tax;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to update tax.'));
          return null;
        }
      },
    };
  }),
);

