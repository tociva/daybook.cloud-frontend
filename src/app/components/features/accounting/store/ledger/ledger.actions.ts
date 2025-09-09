import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { Ledger, LedgerCU } from './ledger.model';

export const ledgerActions = createActionGroup({
  source: 'Ledger',
  events: {
    // Create
    createLedger: props<{ ledger: LedgerCU }>(),
    createLedgerSuccess: props<{ ledger: Ledger }>(),
    createLedgerFailure: props<{ error: DbcError }>(),
    
    // Get by Id
    loadLedgerById: props<{ id: string, query?: QueryParamsRep }>(),
    loadLedgerByIdSuccess: props<{ ledger: Ledger }>(),
    loadLedgerByIdFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter
    loadLedgers: props<{ query?: QueryParamsRep }>(),
    loadLedgersSuccess: props<{ ledgers: Ledger[] }>(),
    loadLedgersFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter 
    countLedgers: props<{ query?: QueryParamsRep }>(),
    countLedgersSuccess: props<{ count: Count }>(),
    countLedgersFailure: props<{ error: DbcError }>(),
    
    // Patch/Update
    updateLedger: props<{ id: string; ledger: LedgerCU }>(),
    updateLedgerSuccess: props<{ ledger: Ledger }>(),
    updateLedgerFailure: props<{ error: DbcError }>(),
    
    // Delete
    deleteLedger: props<{ id: string }>(),
    deleteLedgerSuccess: props<{ id: string }>(),
    deleteLedgerFailure: props<{ error: DbcError }>()
  }
});
