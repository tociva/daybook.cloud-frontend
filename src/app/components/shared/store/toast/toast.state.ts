import { ToastMessage } from './toast.model';

export interface ToastState {
  toasts: ToastMessage[];
}

export const initialToastState: ToastState = {
  toasts: []
};
