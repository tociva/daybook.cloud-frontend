import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { buildLoopbackFilterParams, buildLoopbackWhereParams } from '../../../../util/http-params-builder';
import * as BankCashActions from './bank-cash.actions';
import { BankCash } from './bank-cash.model';
import { ConfigService } from '../../../../core/config/config.service';


@Injectable()
export class BankCashEffects {

  private baseUrl: string = '';

  constructor(private actions$: Actions, private http: HttpClient, private configService: ConfigService) {
    
  }

  private getBaseUrl(): string {
    if (!this.baseUrl) {
      this.baseUrl = `${this.configService.apiBaseUrl}/bank-cash`;
    }
    return this.baseUrl;
  }

  loadBankCash$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BankCashActions.loadBankCash),
      mergeMap(({ query }) => {
        const searchFields = ['name', 'description'];

        const filterParams = buildLoopbackFilterParams(query, searchFields);
        const whereParams = buildLoopbackWhereParams(query, searchFields);

        return this.http.get<BankCash[]>(this.getBaseUrl(), { params: filterParams }).pipe(
          switchMap(data =>
            this.http
              .get<{ count: number }>(`${this.getBaseUrl()}/count`, { params: whereParams })
              .pipe(
                map(res => BankCashActions.loadBankCashSuccess({ bankCashList: data, count: res.count }))
              )
          ),
          catchError(error => of(BankCashActions.loadBankCashFailure({ error })))
        );
      })
    )
  );

  createBankCash$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BankCashActions.createBankCash),
      mergeMap(({ bankCash }) =>
        this.http.post<BankCash>(this.getBaseUrl(), bankCash).pipe(
          map(data => BankCashActions.createBankCashSuccess({ bankCash: data })),
          catchError(error => of(BankCashActions.createBankCashFailure({ error })))
        )
      )
    )
  );

  updateBankCash$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BankCashActions.updateBankCash),
      mergeMap(({ id, bankCash }) =>
        this.http.put<BankCash>(`${this.getBaseUrl()}/${id}`, bankCash).pipe(
          map(data => BankCashActions.updateBankCashSuccess({ bankCash: data })),
          catchError(error => of(BankCashActions.updateBankCashFailure({ error })))
        )
      )
    )
  );

  deleteBankCash$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BankCashActions.deleteBankCash),
      mergeMap(({ id }) =>
        this.http.delete<void>(`${this.getBaseUrl()}/${id}`).pipe(
          map(() => BankCashActions.deleteBankCashSuccess({ id })),
          catchError(error => of(BankCashActions.deleteBankCashFailure({ error })))
        )
      )
    )
  );
}
