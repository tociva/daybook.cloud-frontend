import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-rep';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { BankCash, BankCashCU } from './bank-cash.model';

export const bankCashActions = createActionGroup({
  source: 'BankCash',
  events: {
    // Create
    createBankCash: props<{ bankCash: BankCashCU }>(),
    createBankCashSuccess: props<{ bankCash: BankCash }>(),
    createBankCashFailure: props<{ error: DbcError }>(),
    
    // Get by Id
    loadBankCashById: props<{ id: string }>(),
    loadBankCashByIdSuccess: props<{ bankCash: BankCash }>(),
    loadBankCashByIdFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter
    loadBankCashes: props<{ query?: QueryParamsRep }>(),
    loadBankCashesSuccess: props<{ bankCashes: BankCash[] }>(),
    loadBankCashesFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter 
    countBankCashes: props<{ query?: QueryParamsRep }>(),
    countBankCashesSuccess: props<{ count: Count }>(),
    countBankCashesFailure: props<{ error: DbcError }>(),
    
    // Patch/Update
    updateBankCash: props<{ id: string; bankCash: BankCashCU }>(),
    updateBankCashSuccess: props<{ bankCash: BankCash }>(),
    updateBankCashFailure: props<{ error: DbcError }>(),
    
    // Delete
    deleteBankCash: props<{ id: string }>(),
    deleteBankCashSuccess: props<{ id: string }>(),
    deleteBankCashFailure: props<{ error: DbcError }>()
  }
});
