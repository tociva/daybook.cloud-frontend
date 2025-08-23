import { ActivatedRoute } from "@angular/router";

import { Router } from "@angular/router";

export type LB4Search = {query:string, fields:string[]};
export interface QueryParamsRep {
  page?:number;
  limit?: number,
  offset?: number,
  search?: LB4Search,
  sort?: [string, string][],
  includes?: string[],
};

export interface QueryParamsOriginal {
  page?:string|null;
  limit?: string|null,
  offset?: string|null,
  search?: string|null,
  sort?: string|null,
  includes?: string|null,
};

export const findQueryParamsOriginal = (route: ActivatedRoute): QueryParamsOriginal => {
  return {
    page: route.snapshot.queryParams['page'] ?? '',
    limit: route.snapshot.queryParams['limit'] ?? '',
    offset: route.snapshot.queryParams['offset'] ?? '',
    search: route.snapshot.queryParams['search'] ?? '',
    sort: route.snapshot.queryParams['sort'] ?? '',
    includes: route.snapshot.queryParams['includes'] ?? '',
  };
};  

export const parseQueryParams = (queryParams: QueryParamsOriginal): QueryParamsRep => {
  return {
    page: queryParams.page ? parseInt(queryParams.page) : 1,
    limit: queryParams.limit ? parseInt(queryParams.limit) : 10,
    offset: queryParams.offset ? parseInt(queryParams.offset) : 0,
    search: {query: queryParams.search ?? '', fields: []},
    sort: queryParams.sort ? queryParams.sort.split(',').map(sort => sort.split(':') as [string, string]) : [],
    includes: queryParams.includes ? queryParams.includes.split(',') : [],
  };
};

export const updateUrlParams = (router: Router, route: ActivatedRoute, queryParams: QueryParamsOriginal): void => {
  // Update URL query parameters
  router.navigate([], {
    relativeTo: route,
    queryParams: {
      ...route.snapshot.queryParams, // Preserve other query params
      ...queryParams
    },
    queryParamsHandling: 'merge'
  });
}