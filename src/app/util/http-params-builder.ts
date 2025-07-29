import { HttpParams } from '@angular/common/http';
import { ListApiQuery } from './list-api-query.type';

export function buildLoopbackFilterParams(query?: ListApiQuery, searchFields: string[] = []): HttpParams {
  const filter: any = {
    where: {},
    skip: 0,
    limit: 10,
  };

  // Pagination
  if (query?.limit) filter.limit = query.limit;
  if (query?.page) filter.skip = (query.page - 1) * filter.limit;

  // Search (LIKE) on specified fields
  if (query?.search && searchFields.length > 0) {
    filter.where = {
      or: searchFields.map(field => ({
        [field]: { like: `%${query.search}%` }
      }))
    };
  }

  return new HttpParams().set('filter', JSON.stringify(filter));
}

export function buildLoopbackWhereParams(query?: ListApiQuery, searchFields: string[] = []): HttpParams | undefined {
  if (!query?.search || searchFields.length === 0) return undefined;

  const where = {
    or: searchFields.map(field => ({
      [field]: { like: `%${query.search}%` }
    }))
  };

  return new HttpParams().set('where', JSON.stringify(where));
}
