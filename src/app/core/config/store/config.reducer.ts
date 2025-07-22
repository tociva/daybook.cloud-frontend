import { createReducer, on } from '@ngrx/store';
import * as ConfigActions from './config.actions';
import { ConfigModel } from './config.model';

export interface ConfigState {
  config: ConfigModel;
  loaded: boolean;
  error: any | null;
}

const initialState: ConfigState = {
  config: {
    auth: {
      issuer: '',
      authority: '',
      clientId: '',
      redirectUri: '',
      postLoginRedirect: '',
      loginUrl: '',
      scope: '',
    },
    apiBaseUrl: '',
  },
  loaded: false,
  error: null,
};

export const configReducer = createReducer(
  initialState,
  on(ConfigActions.loadConfig, state => ({ ...state, loaded: false })),
  on(ConfigActions.loadConfigSuccess, (state, { config }) => ({ ...state, loaded: true, config })),
  on(ConfigActions.loadConfigFailure, (state, { error }) => ({ ...state, loaded: false, error })),
);
