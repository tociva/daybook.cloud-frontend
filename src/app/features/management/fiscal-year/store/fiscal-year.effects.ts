import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as FiscalYearActions from './fiscal-year.actions';
import { ConfigService } from '../../../../core/config/config.service';
import { FiscalYear } from './fiscal-year.models';
import { buildLoopbackFilterParams, buildLoopbackWhereParams } from '../../../../util/http-params-builder';

@Injectable()
export class FiscalYearEffects {
  private baseUrl: string = '';

  constructor(private actions$: Actions, private http: HttpClient, private configService: ConfigService) {}

  private getBaseUrl(): string {
    if (!this.baseUrl) {
      this.baseUrl = `${this.configService.apiBaseUrl}/organization/fiscal-year`;
    }
    return this.baseUrl;
  }

  loadFiscalYears$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FiscalYearActions.loadFiscalYears),
      mergeMap(({ query }) => {
        const searchFields = ['name', 'email'];
        const filterParams = buildLoopbackFilterParams(query, searchFields);
        const whereParams = buildLoopbackWhereParams(query, searchFields);

        return this.http.get<FiscalYear[]>(this.getBaseUrl(), { params: filterParams }).pipe(
          switchMap(data =>
            this.http.get<{ count: number }>(`${this.getBaseUrl()}/count`, { params: whereParams }).pipe(
              map(res => FiscalYearActions.loadFiscalYearsSuccess({ fiscalYears: data, count: res.count }))
            )
          ),
          catchError(error => of(FiscalYearActions.loadFiscalYearsFailure({ error })))
        );
      })
    )
  );
}
