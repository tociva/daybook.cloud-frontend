import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { BankCashLedgerMap, BankCashLedgerMapCU } from './bank-ledger-map.model';

export const bankLedgerMapActions = createActionGroup({
  source: 'BankLedgerMap',
  events: {
    // Create
    createBankLedgerMap: props<{ bankLedgerMap: BankCashLedgerMapCU }>(),
    createBankLedgerMapSuccess: props<{ bankLedgerMap: BankCashLedgerMap }>(),
    createBankLedgerMapFailure: props<{ error: DbcError }>(),
    
    // Get by Id
    loadBankLedgerMapById: props<{ id: string, query?: QueryParamsRep }>(),
    loadBankLedgerMapByIdSuccess: props<{ bankLedgerMap: BankCashLedgerMap }>(),
    loadBankLedgerMapByIdFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter
    loadBankLedgerMaps: props<{ query?: QueryParamsRep }>(),
    loadBankLedgerMapsSuccess: props<{ bankLedgerMaps: BankCashLedgerMap[] }>(),
    loadBankLedgerMapsFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter 
    countBankLedgerMaps: props<{ query?: QueryParamsRep }>(),
    countBankLedgerMapsSuccess: props<{ count: Count }>(),
    countBankLedgerMapsFailure: props<{ error: DbcError }>(),
    
    // Patch/Update
    updateBankLedgerMap: props<{ id: string; bankLedgerMap: BankCashLedgerMapCU }>(),
    updateBankLedgerMapSuccess: props<{ bankLedgerMap: BankCashLedgerMap }>(),
    updateBankLedgerMapFailure: props<{ error: DbcError }>(),
    
    // Delete
    deleteBankLedgerMap: props<{ id: string }>(),
    deleteBankLedgerMapSuccess: props<{ id: string }>(),
    deleteBankLedgerMapFailure: props<{ error: DbcError }>(),

    // Bulk Upload
    uploadBulkBankLedgerMaps: props<{ file: File }>(),
    uploadBulkBankLedgerMapsSuccess: props<{ bankLedgerMaps: BankCashLedgerMap[] }>(),
    uploadBulkBankLedgerMapsFailure: props<{ error: DbcError }>()
  }
});

