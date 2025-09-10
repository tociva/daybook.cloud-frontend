import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { FiscalYear } from './fiscal-year.model';

export const fiscalYearActions = createActionGroup({
  source: 'Branch',
  events: {
    loadFiscalYears: props<{ query?: QueryParamsRep }>(),
    loadFiscalYearsSuccess: props<{ fiscalYears: FiscalYear[]}>(),
    loadFiscalYearsFailure: props<{ error: DbcError }>(),

    loadFiscalYearById: props<{ id: string }>(),
    loadFiscalYearByIdSuccess: props<{ fiscalYear: FiscalYear }>(),
    loadFiscalYearByIdFailure: props<{ error: DbcError }>(),

    createFiscalYear: props<{ fiscalYear: FiscalYear }>(),
    createFiscalYearSuccess: props<{ fiscalYear: FiscalYear }>(),
    createFiscalYearFailure: props<{ error: DbcError }>(),

    countFiscalYears: props<{ query?: QueryParamsRep }>(),
    countFiscalYearsSuccess: props<{ count: Count }>(),
    countFiscalYearsFailure: props<{ error: DbcError }>(),

    updateFiscalYear: props<{ id: string; fiscalYear: FiscalYear }>(),
    updateFiscalYearSuccess: props<{ fiscalYear: FiscalYear }>(),
    updateFiscalYearFailure: props<{ error: DbcError }>(),

    deleteFiscalYear: props<{ id: string }>(),
    deleteFiscalYearSuccess: props<{ id: string }>(),
    deleteFiscalYearFailure: props<{ error: DbcError }>(),
  }
});