// base-list.store.ts
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { BaseListModel } from './base-list.model';
import { createInitialBaseListState } from './base-list.initial';

export function createBaseListStore<T>(
  featureKey: string,
  options?: Partial<BaseListModel<T>>
) {
  const initialState: BaseListModel<T> = {
    ...createInitialBaseListState<T>(),
    ...options,
  };

  return signalStore(
    { providedIn: 'root' },
    withState<BaseListModel<T>>(initialState),

    withMethods((store) => ({
      setState(stateFn: (state: BaseListModel<T>) => Partial<BaseListModel<T>>) {
        const current: BaseListModel<T> = {
          items: store.items(),
          count: store.count(),
          page: store.page(),
          limit: store.limit(),
          skip: store.skip(),
          error: store.error(),
          search: store.search?.(),
          sort: store.sort?.(),
          filters: store.filters?.(),
        };
        patchState(store, stateFn(current));
      },

      setItems(items: T[]) {
        patchState(store, { items, error: null });
      },

      setError(error: unknown) {
        patchState(store, { error });
      },

      setPage(page: number) {
        patchState(store, { page });
      },

      setCount(count: number) {
        patchState(store, { count });
      },

      setSearch(search: string) {
        patchState(store, { search });
      },

      resetState() {
        patchState(store, createInitialBaseListState<T>());
      },
    }))
  );
}
