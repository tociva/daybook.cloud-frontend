import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs';
import { loadDateFormats } from './date-format.action';
import { DateFormat } from './date-format.model';
import { DateFormatStore } from './date-format.store';
import { CountryStore } from '../country/country.store';
import { COMMON_DATE_FORMATS } from '../../../../util/constants';

export const dateFormatEffects = {
  loadDateFormats: createEffect(
    () => {
      const actions$ = inject(Actions);
      const dateFormatStore = inject(DateFormatStore);
      const countryStore = inject(CountryStore);

      return actions$.pipe(
        ofType(loadDateFormats),
        tap(() => {
          try {
            const countries = countryStore.countries();
            const formatsFromCountries = countries.map((country) => country.dateFormat);
            const uniqueDateFormats: DateFormat[] = Array.from(
              new Map(
                [...formatsFromCountries, ...COMMON_DATE_FORMATS].map((format) => [format?.name, format ?? {name: '', value: ''}])
              ).values()
            );
            dateFormatStore.setState((state) => ({
              ...state,
              dateFormats: uniqueDateFormats,
              loaded: true,
              error: null
            }));
          } catch (error) {
            dateFormatStore.setState((state) => ({
              ...state,
              dateFormats: [],
              loaded: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }));
            console.error('[DateFormatEffects] Failed to extract date formats:', error);
          }
        })
      );
    },
    { functional: true, dispatch: false }
  )
};
