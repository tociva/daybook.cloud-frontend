import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ConfigState } from './config.reducer';

export const selectConfigState = createFeatureSelector<ConfigState>('config');


export const selectConfigLoaded = createSelector(
  selectConfigState,
  configState => Boolean(configState?.loaded)
);

export const selectConfig = createSelector(
  selectConfigState,
  configState => configState?.config
);