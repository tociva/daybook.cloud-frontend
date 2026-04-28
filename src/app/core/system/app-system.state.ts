import { AppSystemModel } from './app-system.model';

export interface AppSystemState {
  system: AppSystemModel;
}

export const initialAppSystemState: AppSystemState = {
  system: {
    configLoaded: false,
    startupStatus: 'idle',
    error: null,
  },
};
