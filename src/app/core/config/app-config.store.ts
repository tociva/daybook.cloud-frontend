import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../api/api-error.util';
import { AppConfig } from './app-config.model';
import { AppConfigService } from './app-config.service';
import { initialAppConfigState } from './app-config.state';

export const AppConfigStore = signalStore(
  { providedIn: 'root' },
  withState(initialAppConfigState),
  withComputed(({ config }) => ({
    activeAuth: computed(() => config()?.auth ?? null),
    activeApiBaseUrl: computed(() => config()?.apiBaseUrl ?? null),
  })),
  withMethods((store, appConfigService = inject(AppConfigService)) => ({
    async load(): Promise<AppConfig | null> {
      patchState(store, { config: null, isLoading: true, error: null });

      try {
        const config = await appConfigService.loadConfig();
        patchState(store, { config, isLoading: false, error: null });
        return config;
      } catch (error) {
        const message = getApiErrorMessage(error, 'Unable to load app config.');
        patchState(store, { config: null, isLoading: false, error: message });
        return null;
      }
    },
  })),
);
