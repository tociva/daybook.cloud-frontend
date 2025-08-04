import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { createListQueryStore } from '../../../../../../util/create-list-query-store';
import { initialSubscriptionState, SubscriptionModel } from './subscription.state';
import { Store } from '@ngrx/store';
import { inject } from '@angular/core';
import { loadSubscriptions } from './subscription.actions';

const {
  query,
  search,
  page,
  limit,
  filters,
  sort,
  setSearch,
  setPage,
  setLimit,
  setFilters,
  setSort,
} = createListQueryStore();

export const SubscriptionStore = signalStore(
  { providedIn: 'root' },
  withState<SubscriptionModel>(initialSubscriptionState),

  withComputed(() => ({
    query,
    search,
    page,
    limit,
    filters,
    sort,
  })),

  withMethods(() => ({
    loadSubscriptions() {
      const store = inject(Store);
      store.dispatch(loadSubscriptions({ query: query() }));
    },

    setSearch,
    setPage,
    setLimit,
    setFilters,
    setSort,
  }))
);
