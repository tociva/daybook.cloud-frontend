import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { Item, ItemGetQuery, ItemListQuery, ItemPayload } from './item.model';
import { ItemService } from './item.service';
import { initialItemState } from './item.state';

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const ItemStore = signalStore(
  { providedIn: 'root' },
  withState(initialItemState),
  withComputed(({ item }) => ({
    count: computed(() => item().count),
    error: computed(() => item().error),
    isLoading: computed(() => item().isLoading),
    items: computed(() => item().items),
    selectedItem: computed(() => item().selectedItem),
  })),
  withMethods((store, service = inject(ItemService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        item: { ...state.item, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        item: { ...state.item, error, isLoading: false },
      }));
    };

    return {
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          item: { ...state.item, selectedItem: null },
        }));
      },

      async createItem(payload: ItemPayload): Promise<Item | null> {
        setLoading();
        try {
          const item = await service.create(payload);
          patchState(store, (state) => ({
            item: {
              ...state.item,
              count: state.item.count + 1,
              error: null,
              isLoading: false,
              items: [item, ...state.item.items],
              selectedItem: item,
            },
          }));
          return item;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to create item.'));
          return null;
        }
      },

      async deleteItem(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            item: {
              ...state.item,
              count: Math.max(state.item.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.item.items.filter((i) => i.id !== id),
              selectedItem: state.item.selectedItem?.id === id ? null : state.item.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to delete item.'));
          return false;
        }
      },

      async loadItemById(id: string, query?: ItemGetQuery): Promise<Item | null> {
        setLoading();
        try {
          const item = await service.getById(id, query);
          patchState(store, (state) => ({
            item: { ...state.item, error: null, isLoading: false, selectedItem: item },
          }));
          return item;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load item.'));
          return null;
        }
      },

      async loadItems(query?: ItemListQuery): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            item: { ...state.item, count, error: null, isLoading: false, items },
          }));
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load items.'));
        }
      },

      async updateItem(id: string, payload: ItemPayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          patchState(store, (state) => {
            const existing = state.item.items.find((currentItem) => currentItem.id === id);
            const mergedItem = existing ? { ...existing, ...payload } : state.item.selectedItem;
            return {
              item: {
                ...state.item,
                error: null,
                isLoading: false,
                items: state.item.items.map((currentItem) =>
                  currentItem.id === id ? { ...currentItem, ...payload } : currentItem,
                ),
                selectedItem: mergedItem,
              },
            };
          });
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to update item.'));
          return false;
        }
      },
    };
  }),
);
