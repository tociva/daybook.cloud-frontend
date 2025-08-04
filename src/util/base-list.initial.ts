import { BaseListModel } from './base-list.model';

export function createInitialBaseListState<T>(): BaseListModel<T> {
  return {
    items: [],
    count: 0,
    page: 1,
    error: null,
    limit: 10,
    skip: 0,
    search: '',
    sort: null,
    filters: {},
  };
}
