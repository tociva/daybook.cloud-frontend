// item.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list.store';
import { Item } from './item.model';

export const ItemStore = createBaseListStore<Item>('item');
