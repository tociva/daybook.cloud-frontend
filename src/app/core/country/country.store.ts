import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { CountryService } from './country.service';
import { initialCountryState } from './country.state';

export const CountryStore = signalStore(
  { providedIn: 'root' },
  withState(initialCountryState),
  withComputed(({ countries, error, isLoading }) => ({
    countries: computed(() => countries()),
    error: computed(() => error()),
    hasCountries: computed(() => countries().length > 0),
    isLoading: computed(() => isLoading()),
  })),
  withMethods((store, countryService = inject(CountryService)) => ({
    async load(): Promise<void> {
      if (store.isLoading()) {
        return;
      }

      patchState(store, { isLoading: true, error: null });

      try {
        const countries = await countryService.loadCountries();
        patchState(store, { countries, error: null, isLoading: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load countries.';
        patchState(store, { countries: [], error: message, isLoading: false });
      }
    },
  })),
);

