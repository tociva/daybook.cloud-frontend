import { createAction, props } from '@ngrx/store';
import { FiscalYear } from './fiscal-year.model';

export const loadFiscalYears = createAction('[FiscalYear] Load Fiscal Years', props<{ query?: any }>());
export const loadFiscalYearsSuccess = createAction('[FiscalYear] Load Fiscal Years Success', props<{ fiscalYears: FiscalYear[], count: number }>());
export const loadFiscalYearsFailure = createAction('[FiscalYear] Load Fiscal Years Failure', props<{ error: any }>()); 