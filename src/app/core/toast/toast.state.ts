import { AppToastModel } from './toast.model';

export type AppToastState = Readonly<{
  toast: AppToastModel;
}>;

export const initialAppToastState: AppToastState = {
  toast: {
    events: [],
    nextId: 1,
  },
};
