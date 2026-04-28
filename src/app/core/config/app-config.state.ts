import { AppConfig } from './app-config.model';

export interface AppConfigState {
  config: AppConfig | null;
  isLoading: boolean;
  error: string | null;
}

export const initialAppConfigState: AppConfigState = {
  config: null,
  isLoading: false,
  error: null,
};

