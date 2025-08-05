import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Country, CountryState } from './country.model';
import { initialCountryState } from './country.state';

export const CountryStore = signalStore(
  { providedIn: 'root' },

  withState<CountryState>(initialCountryState),

  withComputed((state) => ({
    countriesLoaded: () => Boolean(state.countries()),
  })),

  withMethods((store) => ({
    setState(stateFn: (state: CountryState) => Partial<CountryState>) {
      const currentState = {
        countries: store.countries(),
        loaded: store.loaded(),
        error: store.error(),
      } as CountryState;

      const newState = stateFn(currentState);
      patchState(store, newState);
    },

    setCountries(countries: Country[]) {
      patchState(store, { countries });
    },

    setLoaded(loaded: boolean) {
      patchState(store, { loaded });
    },

    setError(error: any) {
      patchState(store, { error });
    },

    resetState() {
      patchState(store, initialCountryState);
    }
  }))
);
