import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs';
import { CountryStore } from '../country/country.store';
import { loadCurrencies } from './currency.action';
import { Currency } from './currency.model';
import { CurrencyStore } from './currency.store';

export const currencyEffects = {
  loadCurrencies: createEffect(
    () => {
      const actions$ = inject(Actions);
      const currencyStore = inject(CurrencyStore);
      const countryStore = inject(CountryStore);

      return actions$.pipe(
        ofType(loadCurrencies),
        tap(() => {
          try {
            const countries = countryStore.countries();
            const uniqueCurrencies: Currency[] = Array.from(
              new Map(
                countries.map((c) => [c.currency.name, c.currency])
              ).values()
            );

            currencyStore.setState((state) => ({
              ...state,
              currencies: uniqueCurrencies,
              loaded: true,
              error: null
            }));
          } catch (error) {
            currencyStore.setState((state) => ({
              ...state,
              currencies: [],
              loaded: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }));
            console.error('[CurrencyEffects] Failed to extract currencies:', error);
          }
        })
      );
    },
    { functional: true, dispatch: false }
  )
};
