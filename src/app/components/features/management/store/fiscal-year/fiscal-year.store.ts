import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { createListQueryStore } from '../../../../../util/store/create-list-query-store';
import { initialFiscalYearState, FiscalYearModel } from './fiscal-year.state';
import { Store } from '@ngrx/store';
import { inject } from '@angular/core';
import { loadFiscalYears } from './fiscal-year.actions';

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

export const FiscalYearStore = signalStore(
  { providedIn: 'root' },
  withState<FiscalYearModel>(initialFiscalYearState),

  withComputed(() => ({
    query,
    search,
    page,
    limit,
    filters,
    sort,
  })),

  withMethods(() => ({
    loadFiscalYears() {
      const store = inject(Store);
      store.dispatch(loadFiscalYears({ query: query() }));
    },

    setSearch,
    setPage,
    setLimit,
    setFilters,
    setSort,
  }))
); 