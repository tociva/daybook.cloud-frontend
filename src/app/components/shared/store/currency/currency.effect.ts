import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { currencyActions } from './currency.action';
import { Currency } from './currency.model';
import { CurrencyStore } from './currency.store';
import { DbcError } from '../../../../util/types/dbc-error.type';

export const currencyEffects = {
  loadCurrencies: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const currencyStore = inject(CurrencyStore);

      return actions$.pipe(
        ofType(currencyActions.loadCurrencies),
        mergeMap(() =>
          http.get<Currency[]>('/assets/currency-list.json').pipe(
            tap((currencies) => {
              currencyStore.setState((state) => ({
                ...state,
                currencies,
                loaded: true,
                error: null,
              }));
            }),
            map((currencies) =>
              currencyActions.loadCurrenciesSuccess({ currencies })
            ),
            catchError((error) => {
              currencyStore.setState((state) => ({
                ...state,
                loaded: false,
                error,
              }));
              console.error('[CurrencyEffects] currency load failed:', error);
              return of(
                currencyActions.loadCurrenciesFailure({
                  error: error as DbcError,
                })
              );
            })
          )
        )
      );
    },
    { functional: true }
  ),
};
