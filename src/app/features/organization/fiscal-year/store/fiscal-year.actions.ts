import { createAction, props } from '@ngrx/store';
import { FiscalYear } from './fiscal-year.models';

export const loadFiscalYears = createAction('[FiscalYear] Load FiscalYears', props<{ query?: any }>());
export const loadFiscalYearsSuccess = createAction('[FiscalYear] Load FiscalYears Success', props<{ fiscalYears: FiscalYear[], count: number }>());
export const loadFiscalYearsFailure = createAction('[FiscalYear] Load FiscalYears Failure', props<{ error: any }>());
