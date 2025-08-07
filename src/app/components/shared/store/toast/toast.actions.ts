import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { ToastType } from './toast.model';

export const toastActions = createActionGroup({
  source: 'Toast',
  events: {
    show: props<{ message: string; toastType: ToastType; duration?: number }>(),
    dismiss: props<{ id: string }>(),
    clearAll: emptyProps()
  }
});
