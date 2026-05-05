import type { ItemCategory } from './item-category.model';

export type ItemCategoryState = Readonly<{
  itemCategory: Readonly<{
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly ItemCategory[];
    selectedItem: ItemCategory | null;
  }>;
}>;

export const initialItemCategoryState: ItemCategoryState = {
  itemCategory: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
