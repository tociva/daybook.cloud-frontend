import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Currency, CurrencyState } from './currency.model';
import { initialCurrencyState } from './currency.state';

export const CurrencyStore = signalStore(
  { providedIn: 'root' },

  withState<CurrencyState>(initialCurrencyState),

  withComputed((state) => ({
    currenciesLoaded: () => {
      const currencies = state.currencies();
      return currencies && currencies.length > 0;
    },

    filteredCurrencies: () => {
      const searchTerm = state.search().toLowerCase();
      return state.currencies().filter((currency) =>
        currency.name.toLowerCase().includes(searchTerm) ||
        currency.code.toLowerCase().includes(searchTerm)
      );
    },

    fetchAllCurrencies: () => {
      return state.currencies();
    },
    
  })),

  withMethods((store) => ({
    setState(stateFn: (state: CurrencyState) => Partial<CurrencyState>) {
      const currentState = {
        currencies: store.currencies(),
        loaded: store.loaded(),
        error: store.error(),
      } as CurrencyState;

      const newState = stateFn(currentState);
      patchState(store, newState);
    },

    setCurrencies(currencies: Currency[]) {
      patchState(store, { currencies });
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
      patchState(store, initialCurrencyState);
    }
  }))
); 