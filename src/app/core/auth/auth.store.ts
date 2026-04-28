import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { initialAuthState } from './auth.state';

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialAuthState),
  withComputed(({ auth }) => ({
    hasCheckedSession: computed(() => auth().sessionChecked),
    isUserAuthenticated: computed(() => auth().isAuthenticated),
  })),
  withMethods((store) => ({
    setSessionState(isAuthenticated: boolean): void {
      patchState(store, (state) => ({
        auth: {
          ...state.auth,
          sessionChecked: true,
          isAuthenticated,
        },
      }));
    },
    resetSessionState(): void {
      patchState(store, initialAuthState);
    },
  })),
);

