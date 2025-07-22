import { createSelector } from '@ngrx/store';
import { ConfigState } from './config.reducer';

export const selectConfigState = (state: ConfigState) => state;

export const selectConfigLoaded = createSelector(
  selectConfigState,
  configState => !!configState && !configState?.loading
);
export const selectConsentAppLoginUrl = createSelector(
  selectConfigState,
  configState => configState.config.consentAppLoginUrl
);
