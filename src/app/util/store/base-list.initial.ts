import { BaseListModel } from './base-list.model';

export function createInitialBaseListState<T>(): BaseListModel<T> {
  return {
    items: [],
    count: 0,
    error: null,
  };
}
