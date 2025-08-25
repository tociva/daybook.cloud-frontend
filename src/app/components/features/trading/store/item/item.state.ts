import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { Item } from './item.model';

export type ItemModel = BaseListModel<Item>;

export const initialItemState: ItemModel = createInitialBaseListState<Item>();
