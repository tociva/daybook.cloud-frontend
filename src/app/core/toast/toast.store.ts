import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { AppToastOptions } from './toast.model';
import { initialAppToastState } from './toast.state';

export const ToastStore = signalStore(
  { providedIn: 'root' },
  withState(initialAppToastState),
  withComputed(({ toast }) => ({
    events: computed(() => toast().events),
  })),
  withMethods((store) => {
    function show(message: string, options: AppToastOptions = {}): void {
      patchState(store, (state) => ({
        toast: {
          ...state.toast,
          events: [
            ...state.toast.events,
            {
              duration: options.duration,
              id: state.toast.nextId,
              message,
              title: options.title,
              tone: options.tone ?? 'neutral',
            },
          ],
          nextId: state.toast.nextId + 1,
        },
      }));
    }

    return {
      clear(): void {
        patchState(store, (state) => ({
          toast: {
            ...state.toast,
            events: [],
          },
        }));
      },
      show,
      success(message: string, options: Omit<AppToastOptions, 'tone'> = {}): void {
        show(message, { ...options, tone: 'success' });
      },
      warning(message: string, options: Omit<AppToastOptions, 'tone'> = {}): void {
        show(message, { ...options, tone: 'warning' });
      },
      danger(message: string, options: Omit<AppToastOptions, 'tone'> = {}): void {
        show(message, { ...options, tone: 'danger' });
      },
      neutral(message: string, options: Omit<AppToastOptions, 'tone'> = {}): void {
        show(message, { ...options, tone: 'neutral' });
      },
    };
  }),
);
