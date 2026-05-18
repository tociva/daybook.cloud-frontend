import type { Item } from './item.model';

export type ItemState = Readonly<{
  item: Readonly<{
    count: number;
    createDraft: Item | null;
    error: string | null;
    isLoading: boolean;
    items: readonly Item[];
    selectedItem: Item | null;
  }>;
}>;

export const initialItemState: ItemState = {
  item: {
    count: 0,
    createDraft: null,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
