import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { ToastItem, ToastMessage } from './toast.model';
import { ToastState, initialToastState } from './toast.state';

export const ToastStore = signalStore(
  { providedIn: 'root' },

  withState<ToastState>(initialToastState),

  withMethods((store) => {
    const show = (
      item: ToastItem,
      toastType: ToastMessage['type'] = 'info',
      duration = 5000
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      const toast: ToastMessage = { id, type: toastType, item, duration };

      patchState(store, {
        toasts: [...store.toasts(), toast]
      });

      setTimeout(() => dismiss(id), duration);
    };

    const dismiss = (id: string) => {
      patchState(store, {
        toasts: store.toasts().filter((t) => t.id !== id)
      });
    };

    const clearAll = () => {
      patchState(store, {
        toasts: []
      });
    };

    return {
      show,
      dismiss,
      clearAll
    };
  })
);