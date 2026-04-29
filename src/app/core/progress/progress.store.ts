import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { initialAppProgressState } from './progress.state';

export const ProgressStore = signalStore(
  { providedIn: 'root' },
  withState(initialAppProgressState),
  withComputed(({ progress }) => ({
    activeRequests: computed(() => progress().activeRequests),
    isVisible: computed(() => progress().activeRequests > 0),
  })),
  withMethods((store) => ({
    hide(): void {
      patchState(store, { progress: { activeRequests: 0 } });
    },
    hideOne(): void {
      patchState(store, (state) => ({
        progress: {
          activeRequests: Math.max(0, state.progress.activeRequests - 1),
        },
      }));
    },
    show(): void {
      patchState(store, (state) => ({
        progress: {
          activeRequests: state.progress.activeRequests + 1,
        },
      }));
    },
  })),
);
