import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { ToastItem, ToastType } from './toast.model';

export const toastActions = createActionGroup({
  source: 'Toast',
  events: {
    show: props<{ item: ToastItem; toastType: ToastType; duration?: number }>(),
    dismiss: props<{ id: string }>(),
    clearAll: emptyProps()
  }
});
