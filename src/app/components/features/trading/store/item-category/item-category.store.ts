// item-category.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { ItemCategory } from './item-category.model';

export const ItemCategoryStore = createBaseListStore<ItemCategory>('item-category');
