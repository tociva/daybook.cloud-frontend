import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type {
  LedgerCategory,
  LedgerCategoryGetQuery,
  LedgerCategoryListQuery,
  LedgerCategoryPayload,
} from './ledger-category.model';
import { LedgerCategoryService } from './ledger-category.service';
import { initialLedgerCategoryState } from './ledger-category.state';

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const LedgerCategoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialLedgerCategoryState),
  withComputed(({ ledgerCategory }) => ({
    count: computed(() => ledgerCategory().count),
    error: computed(() => ledgerCategory().error),
    isLoading: computed(() => ledgerCategory().isLoading),
    items: computed(() => ledgerCategory().items),
    selectedItem: computed(() => ledgerCategory().selectedItem),
  })),
  withMethods((store, service = inject(LedgerCategoryService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        ledgerCategory: { ...state.ledgerCategory, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        ledgerCategory: { ...state.ledgerCategory, error, isLoading: false },
      }));
    };

    return {
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          ledgerCategory: { ...state.ledgerCategory, selectedItem: null },
        }));
      },

      async createLedgerCategory(payload: LedgerCategoryPayload): Promise<LedgerCategory | null> {
        setLoading();
        try {
          const item = await service.create(payload);
          patchState(store, (state) => ({
            ledgerCategory: {
              ...state.ledgerCategory,
              count: state.ledgerCategory.count + 1,
              error: null,
              isLoading: false,
              items: [item, ...state.ledgerCategory.items],
              selectedItem: item,
            },
          }));
          return item;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to create ledger category.'));
          return null;
        }
      },

      async deleteLedgerCategory(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            ledgerCategory: {
              ...state.ledgerCategory,
              count: Math.max(state.ledgerCategory.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.ledgerCategory.items.filter((i) => i.id !== id),
              selectedItem:
                state.ledgerCategory.selectedItem?.id === id
                  ? null
                  : state.ledgerCategory.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to delete ledger category.'));
          return false;
        }
      },

      async loadLedgerCategoryById(
        id: string,
        query?: LedgerCategoryGetQuery,
      ): Promise<LedgerCategory | null> {
        setLoading();
        try {
          const item = await service.getById(id, query);
          patchState(store, (state) => ({
            ledgerCategory: {
              ...state.ledgerCategory,
              error: null,
              isLoading: false,
              selectedItem: item,
            },
          }));
          return item;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load ledger category.'));
          return null;
        }
      },

      async loadLedgerCategories(query?: LedgerCategoryListQuery): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            ledgerCategory: {
              ...state.ledgerCategory,
              count,
              error: null,
              isLoading: false,
              items,
            },
          }));
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load ledger categories.'));
        }
      },

      async updateLedgerCategory(id: string, payload: LedgerCategoryPayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          patchState(store, (state) => ({
            ledgerCategory: {
              ...state.ledgerCategory,
              error: null,
              isLoading: false,
            },
          }));
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to update ledger category.'));
          return false;
        }
      },
    };
  }),
);
