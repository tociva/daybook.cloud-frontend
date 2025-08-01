import { createReducer, on } from '@ngrx/store';
import * as FiscalYearActions from './fiscal-year.actions';
import { FiscalYear } from './fiscal-year.models';

export interface FiscalYearState {
  fiscalYears: FiscalYear[];
  count: number;
  error: any;
}

export const initialState: FiscalYearState = {
  fiscalYears: [],
  count: 0,
  error: null,
};

export const fiscalYearReducer = createReducer(
  initialState,
  on(FiscalYearActions.loadFiscalYearsSuccess, (state, { fiscalYears, count }) => ({
    ...state,
    fiscalYears,
    count,
    error: null,
  })),
  on(FiscalYearActions.loadFiscalYearsFailure, (state, { error }) => ({
    ...state,
    error,
  }))
);
