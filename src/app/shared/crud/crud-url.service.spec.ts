import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrudUrlService } from './crud-url.service';

describe('CrudUrlService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('clears extra query params when updating a normal CRUD filter', async () => {
    const navigate = vi.fn(async () => true);
    const route = {} as ActivatedRoute;

    TestBed.configureTestingModule({
      providers: [
        CrudUrlService,
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: { navigate } },
      ],
    });

    const service = TestBed.inject(CrudUrlService);
    await service.updateFilterInUrl(
      {
        limit: 10,
        offset: 0,
        where: { number: { ilike: '%INV%' } },
      },
      {
        clearQueryParams: ['sourceType', 'status', 'dashboardAction'],
        route,
      },
    );

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: {
        dashboardAction: null,
        filter: JSON.stringify({
          limit: 10,
          offset: 0,
          where: { number: { ilike: '%INV%' } },
        }),
        sourceType: null,
        status: null,
      },
      queryParamsHandling: 'merge',
      relativeTo: route,
      replaceUrl: false,
    });
  });
});
