import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { initialConfigState } from './config.state';
import { ConfigModel } from './config.model';

export const ConfigStore = signalStore(
  { providedIn: 'root' },

  withState<ConfigModel>(initialConfigState),

  withComputed((state) => ({
    configLoaded: () => Boolean(state.loaded()),
  })),

  withMethods((store) => ({
    setState(stateFn: (state: ConfigModel) => Partial<ConfigModel>) {
      const currentState = {
        config: store.config(),
        loaded: store.loaded(),
        error: store.error(),
      } as ConfigModel;

      const newState = stateFn(currentState);
      patchState(store, newState);
    },

    setConfig(config: any) {
      patchState(store, { config });
    },

    setLoaded(loaded: boolean) {
      patchState(store, { loaded });
    },

    setError(error: any) {
      patchState(store, { error });
    },

    resetState() {
      patchState(store, initialConfigState);
    }
  }))
);
