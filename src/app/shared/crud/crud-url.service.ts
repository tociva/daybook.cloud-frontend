import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { Lb4ListQuery } from './lb4-query';
import { DEFAULT_LB4_PAGE_SIZE, serializeLb4FilterForUrl } from './lb4-query';

export type CrudFilterUrlOptions = Readonly<{
  clearQueryParams?: readonly string[];
  defaultPageSize?: number;
  queryParamName?: string;
  replaceUrl?: boolean;
  route: ActivatedRoute;
}>;

@Injectable({ providedIn: 'root' })
export class CrudUrlService {
  private readonly router = inject(Router);

  async updateFilterInUrl(filter: Lb4ListQuery, options: CrudFilterUrlOptions): Promise<void> {
    const defaultPageSize = options.defaultPageSize ?? DEFAULT_LB4_PAGE_SIZE;
    const queryParamName = options.queryParamName ?? 'filter';
    const queryParams: Record<string, string | null> = {
      [queryParamName]: serializeLb4FilterForUrl(filter, defaultPageSize),
    };

    for (const key of options.clearQueryParams ?? []) {
      if (key !== queryParamName) {
        queryParams[key] = null;
      }
    }

    await this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
      relativeTo: options.route,
      replaceUrl: options.replaceUrl ?? false,
    });
  }
}
