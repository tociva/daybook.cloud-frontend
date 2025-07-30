import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FiscalYearState } from './fiscal-year.reducer';

export const selectFiscalYearState = createFeatureSelector<FiscalYearState>('fiscalYear');

export const selectFiscalYears = createSelector(
  selectFiscalYearState,
  (state) => state.fiscalYears
);

export const selectFiscalYearsCount = createSelector(
  selectFiscalYearState,
  (state) => state.count
);

export const selectFiscalYearError = createSelector(
  selectFiscalYearState,
  (state) => state.error
);
