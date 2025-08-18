export interface QueryParamsRep {
  page?:number;
  limit?: number,
  offset?: number,
  search?: string,
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
    search: queryParams.search ?? '',
    sort: queryParams.sort ?? '',
  };
};