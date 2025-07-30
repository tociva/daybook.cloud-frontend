import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as BranchActions from './branch.actions';
import { ConfigService } from '../../../../core/config/config.service';
import { buildLoopbackFilterParams, buildLoopbackWhereParams } from '../../../../util/http-params-builder';
import { Branch } from './branch.models';

@Injectable()
export class BranchEffects {
  private baseUrl: string = '';

  constructor(private actions$: Actions, private http: HttpClient, private configService: ConfigService) {}

  private getBaseUrl(): string {
    if (!this.baseUrl) {
      this.baseUrl = `${this.configService.apiBaseUrl}/organization/branch`;
    }
    return this.baseUrl;
  }

  loadBranchs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BranchActions.loadBranchs),
      mergeMap(({ query }) => {
        const searchFields = ['name', 'email'];
        const filterParams = buildLoopbackFilterParams(query, searchFields);
        const whereParams = buildLoopbackWhereParams(query, searchFields);

        return this.http.get<Branch[]>(this.getBaseUrl(), { params: filterParams }).pipe(
          switchMap(data =>
            this.http.get<{ count: number }>(`${this.getBaseUrl()}/count`, { params: whereParams }).pipe(
              map(res => BranchActions.loadBranchsSuccess({ branchs: data, count: res.count }))
            )
          ),
          catchError(error => of(BranchActions.loadBranchsFailure({ error })))
        );
      })
    )
  );
}
