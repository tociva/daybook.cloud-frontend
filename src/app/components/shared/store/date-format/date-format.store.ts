import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { DateFormat, DateFormatState } from './date-format.model';
import { initialDateFormatState } from './date-format.state';

export const DateFormatStore = signalStore(
  { providedIn: 'root' },

  withState<DateFormatState>(initialDateFormatState),

  withComputed((state) => ({
    dateFormatsLoaded: () => {
      const dateFormats = state.dateFormats();
      return dateFormats && dateFormats.length > 0;
    },

    filteredDateFormats: () => {
      const searchTerm = state.search().toLowerCase();
      return state.dateFormats().filter((dateFormat) =>
        dateFormat.name.toLowerCase().includes(searchTerm) ||
        dateFormat.value.toLowerCase().includes(searchTerm)
      );
    },
    
  })),

  withMethods((store) => ({
    setState(stateFn: (state: DateFormatState) => Partial<DateFormatState>) {
      const currentState = {
        dateFormats: store.dateFormats(),
        loaded: store.loaded(),
        error: store.error(),
      } as DateFormatState;

      const newState = stateFn(currentState);
      patchState(store, newState);
    },

    setDateFormats(dateFormats: DateFormat[]) {
      patchState(store, { dateFormats });
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
      patchState(store, initialDateFormatState);
    }
  }))
); 