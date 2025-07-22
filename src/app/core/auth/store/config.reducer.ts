import { createReducer, on } from '@ngrx/store';
import * as ConfigActions from './config.actions';
import { ConfigModel } from './config.model';

export interface ConfigState {
  config: ConfigModel;
  loading: boolean;
  error: any | null;
}

const initialState: ConfigState = {
  config: {
    consentAppLoginUrl: '',
  },
  loading: false,
  error: null,
};

export const configReducer = createReducer(
  initialState,
  on(ConfigActions.loadConfig, state => ({ ...state, loading: true })),
  on(ConfigActions.loadConfigSuccess, (state, { config }) => ({ ...state, loading: false, config })),
  on(ConfigActions.loadConfigFailure, (state, { error }) => ({ ...state, loading: false, error })),
);
