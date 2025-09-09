import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { LedgerCategory, LedgerCategoryCU } from './ledger-category.model';

export const ledgerCategoryActions = createActionGroup({
  source: 'LedgerCategory',
  events: {
    // Create
    createLedgerCategory: props<{ ledgerCategory: LedgerCategoryCU }>(),
    createLedgerCategorySuccess: props<{ ledgerCategory: LedgerCategory }>(),
    createLedgerCategoryFailure: props<{ error: DbcError }>(),
    
    // Get by Id
    loadLedgerCategoryById: props<{ id: string, query?: QueryParamsRep }>(),
    loadLedgerCategoryByIdSuccess: props<{ ledgerCategory: LedgerCategory }>(),
    loadLedgerCategoryByIdFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter
    loadLedgerCategories: props<{ query?: QueryParamsRep }>(),
    loadLedgerCategoriesSuccess: props<{ ledgerCategories: LedgerCategory[] }>(),
    loadLedgerCategoriesFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter 
    countLedgerCategories: props<{ query?: QueryParamsRep }>(),
    countLedgerCategoriesSuccess: props<{ count: Count }>(),
    countLedgerCategoriesFailure: props<{ error: DbcError }>(),
    
    // Patch/Update
    updateLedgerCategory: props<{ id: string; ledgerCategory: LedgerCategoryCU }>(),
    updateLedgerCategorySuccess: props<{ ledgerCategory: LedgerCategory }>(),
    updateLedgerCategoryFailure: props<{ error: DbcError }>(),
    
    // Delete
    deleteLedgerCategory: props<{ id: string }>(),
    deleteLedgerCategorySuccess: props<{ id: string }>(),
    deleteLedgerCategoryFailure: props<{ error: DbcError }>()
  }
});
