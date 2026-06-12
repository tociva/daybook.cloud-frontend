import { createInitialCachedCrudState, type CachedCrudState } from '../../../../../shared/crud';
import type { ItemCategory } from './item-category.model';

export type ItemCategoryState = Readonly<{
  itemCategory: CachedCrudState<ItemCategory> &
    Readonly<{
      count: number;
      error: string | null;
      isLoading: boolean;
      items: readonly ItemCategory[];
      selectedItem: ItemCategory | null;
    }>;
}>;

export const initialItemCategoryState: ItemCategoryState = {
  itemCategory: {
    ...createInitialCachedCrudState<ItemCategory>(),
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
