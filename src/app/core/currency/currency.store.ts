import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { CurrencyService } from './currency.service';
import { initialCurrencyState } from './currency.state';

export const CurrencyStore = signalStore(
  { providedIn: 'root' },
  withState(initialCurrencyState),
  withComputed(({ currencies, error, isLoading }) => ({
    currencies: computed(() => currencies()),
    error: computed(() => error()),
    hasCurrencies: computed(() => currencies().length > 0),
    isLoading: computed(() => isLoading()),
  })),
  withMethods((store, currencyService = inject(CurrencyService)) => ({
    async load(): Promise<void> {
      if (store.isLoading()) {
        return;
      }

      patchState(store, { isLoading: true, error: null });

      try {
        const currencies = await currencyService.loadCurrencies();
        patchState(store, { currencies, error: null, isLoading: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load currencies.';
        patchState(store, { currencies: [], error: message, isLoading: false });
      }
    },
  })),
);

