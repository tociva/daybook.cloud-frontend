import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { Country } from './country.model';
import { CountryStore } from './country.store';
import { countryActions } from './country.action';
import { DbcError } from '../../../../util/types/dbc-error.type';

export const countryEffects = {
  loadCountries: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const countryStore = inject(CountryStore);

      return actions$.pipe(
        ofType(countryActions.loadCountries),
        mergeMap(() =>
          http.get<Country[]>('/assets/country-list.json').pipe(
            tap((countries) => {
              countryStore.setState((state) => ({
                ...state,
                countries,
                loaded: true,
                error: null,
              }));
            }),
            map((countries) =>
              countryActions.loadCountriesSuccess({ countries })
            ),
            catchError((error) => {
              countryStore.setState((state) => ({
                ...state,
                loaded: false,
                error,
              }));
              console.error('[CountryEffects] country load failed:', error);
              return of(
                countryActions.loadCountriesFailure({
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
