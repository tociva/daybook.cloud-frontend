import { signal, computed } from '@angular/core';
import { ListQueryParams, SortConfig } from './list-query-params.type';

export function createListQueryStore(initial: Partial<ListQueryParams & { page: number }> = {}) {
  const _search = signal(initial.search ?? '');
  const _page = signal(initial.page ?? 1);
  const _limit = signal(initial.limit ?? 10);
  const _filters = signal(initial.filters ?? {});
  const _sort = signal<SortConfig | null>(initial.sort ?? null);

  const query = computed<ListQueryParams>(() => ({
    limit: _limit(),
    skip: (_page() - 1) * _limit(),
    search: _search(),
    filters: _filters(),
    sort: _sort() ?? undefined,
  }));

  return {
    query,
    search: computed(() => _search()),
    page: computed(() => _page()),
    limit: computed(() => _limit()),
    filters: computed(() => _filters()),
    sort: computed(() => _sort()),

    setSearch: (v: string) => (_search.set(v), _page.set(1)),
    setPage: (v: number) => _page.set(v),
    setLimit: (v: number) => (_limit.set(v), _page.set(1)),
    setFilters: (v: Record<string, any>) => (_filters.set(v), _page.set(1)),
    setSort: (v: SortConfig | null) => _sort.set(v),
  };
}
