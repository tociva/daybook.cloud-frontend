import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { loadCountries } from './country.action';
import { Country } from './country.model';
import { CountryStore } from './country.store';
import { loadCurrencies } from '../currency/currency.action';
import { loadDateFormats } from '../date-format/date-format.action';

export const countryEffects = {
  loadConfig: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const countryStore = inject(CountryStore);

      return actions$.pipe(
        ofType(loadCountries),
        mergeMap(() =>
          http.get<Country[]>('/assets/country-list.json').pipe(
            tap((countries) => {
              countryStore.setState((state) => ({
                ...state,
                countries: countries,
                loaded: true,
                error: null
              }));
            }),
            map(() => [loadCurrencies(), loadDateFormats()]),
            mergeMap((actions) => actions),
            catchError((error) => {
              countryStore.setState((state) => ({
                ...state,
                loaded: false,
                error
              }));
              console.error('[CountryEffects] country load failed:', error);
              return of(); 
            })
          )
        )
      );
    },
    { functional: true }
  )
};

