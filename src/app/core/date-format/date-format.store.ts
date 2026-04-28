import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { DateFormatService } from './date-format.service';
import { initialDateFormatState } from './date-format.state';

export const DateFormatStore = signalStore(
  { providedIn: 'root' },
  withState(initialDateFormatState),
  withComputed(({ dateFormats, error, isLoading }) => ({
    dateFormats: computed(() => dateFormats()),
    error: computed(() => error()),
    hasDateFormats: computed(() => dateFormats().length > 0),
    isLoading: computed(() => isLoading()),
  })),
  withMethods((store, dateFormatService = inject(DateFormatService)) => ({
    async load(): Promise<void> {
      if (store.isLoading()) {
        return;
      }

      patchState(store, { isLoading: true, error: null });

      try {
        const dateFormats = await dateFormatService.loadDateFormats();
        patchState(store, { dateFormats, error: null, isLoading: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load date formats.';
        patchState(store, { dateFormats: [], error: message, isLoading: false });
      }
    },
  })),
);

