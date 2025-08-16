// base-list.store.ts
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { BaseListModel } from './base-list.model';
import { createInitialBaseListState } from './base-list.initial';
import { DbcError } from '../types/dbc-error.type';

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
          error: store.error(),
        };
        patchState(store, stateFn(current));
      },

      setItems(items: T[]) {
        patchState(store, { items, error: null });
      },

      setCount(count: number) {
        patchState(store, { count });
      },

      setError(error: DbcError) {
        patchState(store, { error });
      },

      resetState() {
        patchState(store, createInitialBaseListState<T>());
      },
    }))
  );
}
