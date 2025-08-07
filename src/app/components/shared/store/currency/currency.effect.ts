import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs';
import { CountryStore } from '../country/country.store';
import { loadCurrencies } from './currency.action';
import { Currency } from './currency.model';
import { CurrencyStore } from './currency.store';

@Injectable()
export class CurrencyEffects {
  private readonly actions$ = inject(Actions);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly countryStore = inject(CountryStore);

  loadCurrencies$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loadCurrencies),
        tap(() => {
          try {
            const countries = this.countryStore.countries();
            const uniqueCurrencies: Currency[] = Array.from(
              new Map(
                countries.map((c) => [c.currency.name, c.currency])
              ).values()
            );

            this.currencyStore.setState((state) => ({
              ...state,
              currencies: uniqueCurrencies,
              loaded: true,
              error: null
            }));
          } catch (error) {
            this.currencyStore.setState((state) => ({
              ...state,
              currencies: [],
              loaded: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }));
            console.error('[CurrencyEffects] Failed to extract currencies:', error);
          }
        })
      ),
    { dispatch: false }
  );
}
