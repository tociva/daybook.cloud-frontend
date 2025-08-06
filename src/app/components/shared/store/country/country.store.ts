import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Country, CountryState } from './country.model';
import { initialCountryState } from './country.state';

export const CountryStore = signalStore(
  { providedIn: 'root' },

  withState<CountryState>(initialCountryState),

  withComputed((state) => ({
    countriesLoaded: () => {
      const countries = state.countries();
      return countries && countries.length > 0;
    },

    filteredCountries: () => {
      const searchTerm = state.search().toLowerCase();
      return state.countries().filter((country) =>
        country.name.toLowerCase().includes(searchTerm)
      );
    },
    
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

    setSearch(search: string) {
      patchState(store, { search });
    },

    resetState() {
      patchState(store, initialCountryState);
    }
  }))
);
