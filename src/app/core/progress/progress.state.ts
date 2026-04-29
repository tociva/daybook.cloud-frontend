import { AppProgressModel } from './progress.model';

export type AppProgressState = Readonly<{
  progress: AppProgressModel;
}>;

export const initialAppProgressState: AppProgressState = {
  progress: {
    activeRequests: 0,
  },
};
