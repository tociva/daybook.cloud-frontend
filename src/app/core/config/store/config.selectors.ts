import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ConfigState } from './config.reducer';

export const selectConfigState = createFeatureSelector<ConfigState>('config');


export const selectConfigLoaded = createSelector(
  selectConfigState,
  configState => configState?.loaded
);
export const selectLoginUrl = createSelector(
  selectConfigState,
  configState => configState.config.auth.loginUrl
);
