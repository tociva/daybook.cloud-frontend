import { createActionGroup, props } from '@ngrx/store';
import { BankCash, BankCashCU } from './bank-cash.model';
import { DbcError } from '../../../../../util/types/dbc-error.type';

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
    loadBankCashes: props<{ query?: unknown }>(),
    loadBankCashesSuccess: props<{ bankCashes: BankCash[] }>(),
    loadBankCashesFailure: props<{ error: DbcError }>(),
    
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
