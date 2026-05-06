import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { SaleInvoice, SaleInvoiceGetQuery, SaleInvoiceListQuery, SaleInvoicePayload } from './sale-invoice.model';
import { SaleInvoiceService } from './sale-invoice.service';
import { initialSaleInvoiceState } from './sale-invoice.state';

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const SaleInvoiceStore = signalStore(
  { providedIn: 'root' },
  withState(initialSaleInvoiceState),
  withComputed(({ saleInvoice }) => ({
    count: computed(() => saleInvoice().count),
    error: computed(() => saleInvoice().error),
    isLoading: computed(() => saleInvoice().isLoading),
    items: computed(() => saleInvoice().items),
    selectedItem: computed(() => saleInvoice().selectedItem),
  })),
  withMethods((store, service = inject(SaleInvoiceService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        saleInvoice: { ...state.saleInvoice, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        saleInvoice: { ...state.saleInvoice, error, isLoading: false },
      }));
    };

    return {
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          saleInvoice: { ...state.saleInvoice, selectedItem: null },
        }));
      },

      async createSaleInvoice(payload: SaleInvoicePayload): Promise<SaleInvoice | null> {
        setLoading();
        try {
          const invoice = await service.create(payload);
          patchState(store, (state) => ({
            saleInvoice: {
              ...state.saleInvoice,
              count: state.saleInvoice.count + 1,
              error: null,
              isLoading: false,
              items: [invoice, ...state.saleInvoice.items],
              selectedItem: invoice,
            },
          }));
          return invoice;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to create sale invoice.'));
          return null;
        }
      },

      async deleteSaleInvoice(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            saleInvoice: {
              ...state.saleInvoice,
              count: Math.max(state.saleInvoice.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.saleInvoice.items.filter((inv) => inv.id !== id),
              selectedItem:
                state.saleInvoice.selectedItem?.id === id
                  ? null
                  : state.saleInvoice.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to delete sale invoice.'));
          return false;
        }
      },

      async loadSaleInvoiceById(id: string, query?: SaleInvoiceGetQuery): Promise<SaleInvoice | null> {
        setLoading();
        try {
          const invoice = await service.getById(id, query);
          patchState(store, (state) => ({
            saleInvoice: {
              ...state.saleInvoice,
              error: null,
              isLoading: false,
              selectedItem: invoice,
            },
          }));
          return invoice;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load sale invoice.'));
          return null;
        }
      },

      async loadSaleInvoices(query: SaleInvoiceListQuery = {}): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([
            service.list(query),
            service.count(query),
          ]);
          patchState(store, (state) => ({
            saleInvoice: {
              ...state.saleInvoice,
              count,
              error: null,
              isLoading: false,
              items,
            },
          }));
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load sale invoices.'));
        }
      },

      async updateSaleInvoice(
        id: string,
        payload: SaleInvoicePayload,
      ): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          patchState(store, (state) => ({
            saleInvoice: {
              ...state.saleInvoice,
              error: null,
              isLoading: false,
            },
          }));
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to update sale invoice.'));
          return false;
        }
      },
    };
  }),
);
