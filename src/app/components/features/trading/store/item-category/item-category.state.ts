import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { ItemCategory } from './item-category.model';

export type ItemCategoryModel = BaseListModel<ItemCategory>;

export const initialItemCategoryState: ItemCategoryModel = createInitialBaseListState<ItemCategory>();
