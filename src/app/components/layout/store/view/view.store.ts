import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { ViewStateModel } from './view.model';
import { initialViewState } from './view.state';

export const ViewStore = signalStore(
  { providedIn: 'root' },

  withState<ViewStateModel>(initialViewState),

  withComputed((state) => ({
    isSidebarExpanded: () => !state.collapsed(),
    isDarkMode: () => state.theme() === 'dark',
  })),

  withMethods((store) => ({
    toggleCollapsed() {
      patchState(store, { collapsed: !store.collapsed() });
    },

    setTheme(theme: 'light' | 'dark' | 'system') {
      patchState(store, { theme });
    },

    setLoading(loading: boolean) {
      patchState(store, { loading });
    }
  }))
);
