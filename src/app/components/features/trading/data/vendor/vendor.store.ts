import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { Vendor, VendorGetQuery, VendorListQuery, VendorPayload } from './vendor.model';
import { VendorService } from './vendor.service';
import { initialVendorState } from './vendor.state';

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const VendorStore = signalStore(
  { providedIn: 'root' },
  withState(initialVendorState),
  withComputed(({ vendor }) => ({
    count: computed(() => vendor().count),
    error: computed(() => vendor().error),
    isLoading: computed(() => vendor().isLoading),
    items: computed(() => vendor().items),
    selectedItem: computed(() => vendor().selectedItem),
  })),
  withMethods((store, service = inject(VendorService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        vendor: { ...state.vendor, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        vendor: { ...state.vendor, error, isLoading: false },
      }));
    };

    return {
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          vendor: { ...state.vendor, selectedItem: null },
        }));
      },

      async createVendor(payload: VendorPayload): Promise<Vendor | null> {
        setLoading();
        try {
          const vendor = await service.create(payload);
          patchState(store, (state) => ({
            vendor: {
              ...state.vendor,
              count: state.vendor.count + 1,
              error: null,
              isLoading: false,
              items: [vendor, ...state.vendor.items],
              selectedItem: vendor,
            },
          }));
          return vendor;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to create vendor.'));
          return null;
        }
      },

      async deleteVendor(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            vendor: {
              ...state.vendor,
              count: Math.max(state.vendor.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.vendor.items.filter((v) => v.id !== id),
              selectedItem: state.vendor.selectedItem?.id === id ? null : state.vendor.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to delete vendor.'));
          return false;
        }
      },

      async loadVendorById(id: string, query?: VendorGetQuery): Promise<Vendor | null> {
        setLoading();
        try {
          const vendor = await service.getById(id, query);
          patchState(store, (state) => ({
            vendor: { ...state.vendor, error: null, isLoading: false, selectedItem: vendor },
          }));
          return vendor;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load vendor.'));
          return null;
        }
      },

      async loadVendors(query: VendorListQuery = {}): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            vendor: { ...state.vendor, count, error: null, isLoading: false, items },
          }));
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load vendors.'));
        }
      },

      async updateVendor(id: string, payload: VendorPayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          patchState(store, (state) => {
            const existing = state.vendor.items.find((item) => item.id === id);
            const mergedItem = existing ? { ...existing, ...payload } : state.vendor.selectedItem;
            return {
              vendor: {
                ...state.vendor,
                error: null,
                isLoading: false,
                items: state.vendor.items.map((item) =>
                  item.id === id ? { ...item, ...payload } : item,
                ),
                selectedItem: mergedItem,
              },
            };
          });
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to update vendor.'));
          return false;
        }
      },
    };
  }),
);
