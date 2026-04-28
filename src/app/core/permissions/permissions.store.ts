import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { initialPermissionsState } from './permissions.state';

export const PermissionsStore = signalStore(
  { providedIn: 'root' },
  withState(initialPermissionsState),
  withComputed(({ permissions }) => ({
    all: computed(() => permissions().values),
    hasAny: computed(() => permissions().values.length > 0),
  })),
  withMethods((store) => ({
    setPermissions(values: string[]): void {
      patchState(store, (state) => ({
        permissions: {
          ...state.permissions,
          values: [...values],
        },
      }));
    },
    clearPermissions(): void {
      patchState(store, initialPermissionsState);
    },
  })),
);

