import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { BankTxn, BankTxnCU } from './bank-txn.model';

export const bankTxnActions = createActionGroup({
  source: 'BankTxn',
  events: {
    // Create
    createBankTxn: props<{ bankTxn: BankTxnCU }>(),
    createBankTxnSuccess: props<{ bankTxn: BankTxn }>(),
    createBankTxnFailure: props<{ error: DbcError }>(),
    
    // Get by Id
    loadBankTxnById: props<{ id: string, query?: QueryParamsRep }>(),
    loadBankTxnByIdSuccess: props<{ bankTxn: BankTxn }>(),
    loadBankTxnByIdFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter
    loadBankTxns: props<{ query?: QueryParamsRep }>(),
    loadBankTxnsSuccess: props<{ bankTxns: BankTxn[] }>(),
    loadBankTxnsFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter 
    countBankTxns: props<{ query?: QueryParamsRep }>(),
    countBankTxnsSuccess: props<{ count: Count }>(),
    countBankTxnsFailure: props<{ error: DbcError }>(),
    
    // Patch/Update
    updateBankTxn: props<{ id: string; bankTxn: BankTxnCU }>(),
    updateBankTxnSuccess: props<{ bankTxn: BankTxn }>(),
    updateBankTxnFailure: props<{ error: DbcError }>(),
    
    // Delete
    deleteBankTxn: props<{ id: string }>(),
    deleteBankTxnSuccess: props<{ id: string }>(),
    deleteBankTxnFailure: props<{ error: DbcError }>(),

    // Bulk Upload
    uploadBulkBankTxns: props<{ file: File }>(),
    uploadBulkBankTxnsSuccess: props<{ bankTxns: BankTxn[] }>(),
    uploadBulkBankTxnsFailure: props<{ error: DbcError }>()
  }
});


