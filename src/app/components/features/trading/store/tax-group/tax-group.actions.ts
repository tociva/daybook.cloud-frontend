import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { TaxGroup, TaxGroupCU } from './tax-group.model';

export const taxGroupActions = createActionGroup({
  source: 'TaxGroup',
  events: {
    // Create
    createTaxGroup: props<{ taxGroup: TaxGroupCU }>(),
    createTaxGroupSuccess: props<{ taxGroup: TaxGroup }>(),
    createTaxGroupFailure: props<{ error: DbcError }>(),
    
    // Get by Id
    loadTaxGroupById: props<{ id: string, query?: QueryParamsRep }>(),
    loadTaxGroupByIdSuccess: props<{ taxGroup: TaxGroup }>(),
    loadTaxGroupByIdFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter
    loadTaxGroups: props<{ query?: QueryParamsRep }>(),
    loadTaxGroupsSuccess: props<{ taxGroups: TaxGroup[] }>(),
    loadTaxGroupsFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter 
    countTaxGroups: props<{ query?: QueryParamsRep }>(),
    countTaxGroupsSuccess: props<{ count: Count }>(),
    countTaxGroupsFailure: props<{ error: DbcError }>(),
    
    // Patch/Update
    updateTaxGroup: props<{ id: string; taxGroup: TaxGroupCU }>(),
    updateTaxGroupSuccess: props<{ taxGroup: TaxGroup }>(),
    updateTaxGroupFailure: props<{ error: DbcError }>(),
    
    // Delete
    deleteTaxGroup: props<{ id: string }>(),
    deleteTaxGroupSuccess: props<{ id: string }>(),
    deleteTaxGroupFailure: props<{ error: DbcError }>()
  }
});
