import { signal, computed } from '@angular/core';
import { ListQueryParams, SortConfig } from './base-list.model';

const _search = signal('');
const _page = signal(1);
const _limit = signal(10);
const _filters = signal<Record<string, any>>({});
const _sort = signal<SortConfig | null>(null);

export const search = computed(() => _search());
export const page = computed(() => _page());
export const limit = computed(() => _limit());
export const filters = computed(() => _filters());
export const sort = computed(() => _sort());

export const query = computed<ListQueryParams>(() => {
  return {
    limit: _limit(),
    skip: (_page() - 1) * _limit(),
    search: _search(),
    filters: _filters(),
    sort: _sort() ?? undefined,
  };
});

// Optional: reset function
export const resetQueryParams = () => {
  _search.set('');
  _page.set(1);
  _limit.set(10);
  _filters.set({});
  _sort.set(null);
};

// Public setters
export const setSearch = (value: string) => {
  _search.set(value);
  _page.set(1);
};

export const setPage = (value: number) => _page.set(value);

export const setLimit = (value: number) => {
  _limit.set(value);
  _page.set(1);
};

export const setFilters = (value: Record<string, any>) => {
  _filters.set(value);
  _page.set(1);
};

export const setSort = (value: SortConfig) => {
  _sort.set(value);
};
