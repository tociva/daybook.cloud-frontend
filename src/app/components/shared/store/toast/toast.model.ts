export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  title?: string;
  message: string;
}
export interface ToastMessage {
  id: string;
  type: ToastType;
  item: ToastItem;
  duration?: number;
}
