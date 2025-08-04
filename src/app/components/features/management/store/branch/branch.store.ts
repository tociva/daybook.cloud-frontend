import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { createListQueryStore } from '../../../../../../util/create-list-query-store';
import { initialBranchState, BranchModel } from './branch.state';
import { Store } from '@ngrx/store';
import { inject } from '@angular/core';
import { loadBranches } from './branch.actions';

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

export const BranchStore = signalStore(
  { providedIn: 'root' },
  withState<BranchModel>(initialBranchState),

  withComputed(() => ({
    query,
    search,
    page,
    limit,
    filters,
    sort,
  })),

  withMethods(() => ({
    loadBranches() {
      const store = inject(Store);
      store.dispatch(loadBranches({ query: query() }));
    },

    setSearch,
    setPage,
    setLimit,
    setFilters,
    setSort,
  }))
); 