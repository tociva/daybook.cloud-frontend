import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type {
  ItemCategory,
  ItemCategoryGetQuery,
  ItemCategoryListQuery,
  ItemCategoryPayload,
} from './item-category.model';
import { ItemCategoryService } from './item-category.service';
import { initialItemCategoryState } from './item-category.state';

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const ItemCategoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialItemCategoryState),
  withComputed(({ itemCategory }) => ({
    count: computed(() => itemCategory().count),
    error: computed(() => itemCategory().error),
    isLoading: computed(() => itemCategory().isLoading),
    items: computed(() => itemCategory().items),
    selectedItem: computed(() => itemCategory().selectedItem),
  })),
  withMethods((store, service = inject(ItemCategoryService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        itemCategory: { ...state.itemCategory, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        itemCategory: { ...state.itemCategory, error, isLoading: false },
      }));
    };

    return {
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          itemCategory: { ...state.itemCategory, selectedItem: null },
        }));
      },
      setSelectedItem(itemCategory: ItemCategory): void {
        patchState(store, (state) => ({
          itemCategory: { ...state.itemCategory, selectedItem: itemCategory },
        }));
      },

      async createItemCategory(payload: ItemCategoryPayload): Promise<ItemCategory | null> {
        setLoading();
        try {
          const itemCategory = await service.create(payload);
          patchState(store, (state) => ({
            itemCategory: {
              ...state.itemCategory,
              count: state.itemCategory.count + 1,
              error: null,
              isLoading: false,
              items: [itemCategory, ...state.itemCategory.items],
              selectedItem: itemCategory,
            },
          }));
          return itemCategory;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to create item category.'));
          return null;
        }
      },

      async deleteItemCategory(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            itemCategory: {
              ...state.itemCategory,
              count: Math.max(state.itemCategory.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.itemCategory.items.filter((i) => i.id !== id),
              selectedItem:
                state.itemCategory.selectedItem?.id === id ? null : state.itemCategory.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to delete item category.'));
          return false;
        }
      },

      async loadItemCategoryById(
        id: string,
        query?: ItemCategoryGetQuery,
      ): Promise<ItemCategory | null> {
        setLoading();
        try {
          const itemCategory = await service.getById(id, query);
          patchState(store, (state) => ({
            itemCategory: {
              ...state.itemCategory,
              error: null,
              isLoading: false,
              selectedItem: itemCategory,
            },
          }));
          return itemCategory;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load item category.'));
          return null;
        }
      },

      async loadItemCategories(query?: ItemCategoryListQuery): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            itemCategory: { ...state.itemCategory, count, error: null, isLoading: false, items },
          }));
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load item categories.'));
        }
      },

      async updateItemCategory(id: string, payload: ItemCategoryPayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          patchState(store, (state) => {
            const existing = state.itemCategory.items.find((item) => item.id === id);
            const mergedItem = existing
              ? { ...existing, ...payload }
              : state.itemCategory.selectedItem;
            return {
              itemCategory: {
                ...state.itemCategory,
                error: null,
                isLoading: false,
                items: state.itemCategory.items.map((item) =>
                  item.id === id ? { ...item, ...payload } : item,
                ),
                selectedItem: mergedItem,
              },
            };
          });
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to update item category.'));
          return false;
        }
      },
    };
  }),
);
