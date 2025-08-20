import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { SearchItem, SearchItemStateModel } from './search-item.model';
import { initialSearchItemState } from './search-item.state';

export const SearchItemStore = signalStore(
  { providedIn: 'root' },

  withState<SearchItemStateModel>(initialSearchItemState),

  withComputed((state) => ({
    isIncludeSearchInComponent: () => !!state.currentTitle(),
    filteredItems: () => {
      if(!state.query()) {
        return state.items();
      }
      const query = state.query()!;
      const items : SearchItem[] = state.items().filter(item => item.value.toLowerCase().includes(query.toLowerCase()));
      if(state.currentTitle()) {
        items.unshift({
          displayValue: `Search in ${state.currentTitle()} : ${query}`,
          value: query,
          type: 'search',
          query
        });
      }
      return items;
    }
  })),

  withMethods((store) => ({
    setCurrentTitle(title: string | null) {
      patchState(store, { currentTitle: title });
    },

    setCurrentQuery(query: string | null) {
      patchState(store, { query });
    },

    setItems(items: SearchItem[]) {
      patchState(store, { items });
    }
  }))
);
