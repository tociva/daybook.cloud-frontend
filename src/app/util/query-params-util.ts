import { ActivatedRoute } from "@angular/router";

import { Router } from "@angular/router";

export type LB4Search = {query:string, fields:string[]};
export interface QueryParamsRep {
  page?:number;
  limit?: number,
  offset?: number,
  search?: LB4Search,
  sort?: string,
};

export interface QueryParamsOriginal {
  page?:string;
  limit?: string,
  offset?: string,
  search?: string,
  sort?: string,
};

export const parseQueryParams = (queryParams: QueryParamsOriginal): QueryParamsRep => {
  return {
    page: queryParams.page ? parseInt(queryParams.page) : 1,
    limit: queryParams.limit ? parseInt(queryParams.limit) : 10,
    offset: queryParams.offset ? parseInt(queryParams.offset) : 0,
    search: {query: queryParams.search ?? '', fields: []},
    sort: queryParams.sort ?? '',
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