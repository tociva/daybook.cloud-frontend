import { createActionGroup, props } from '@ngrx/store';
import { FiscalYear } from './fiscal-year.model';

export const fiscalYearActions = createActionGroup({
  source: 'FiscalYear',
  events: {
    loadFiscalYears: props<{ query?: any }>(),
    loadFiscalYearsSuccess: props<{ fiscalYears: FiscalYear[], count: number }>(),
    loadFiscalYearsFailure: props<{ error: any }>()
  }
}); 