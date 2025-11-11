import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { Tax, TaxCU } from './tax.model';

export const taxActions = createActionGroup({
  source: 'Tax',
  events: {
    // Create
    createTax: props<{ tax: TaxCU }>(),
    createTaxSuccess: props<{ tax: Tax }>(),
    createTaxFailure: props<{ error: DbcError }>(),
    
    // Get by Id
    loadTaxById: props<{ id: string }>(),
    loadTaxByIdSuccess: props<{ tax: Tax }>(),
    loadTaxByIdFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter
    loadTaxes: props<{ query?: QueryParamsRep }>(),
    loadTaxesSuccess: props<{ taxes: Tax[] }>(),
    loadTaxesFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter 
    countTaxes: props<{ query?: QueryParamsRep }>(),
    countTaxesSuccess: props<{ count: Count }>(),
    countTaxesFailure: props<{ error: DbcError }>(),
    
    // Patch/Update
    updateTax: props<{ id: string; tax: TaxCU }>(),
    updateTaxSuccess: props<{ tax: Tax }>(),
    updateTaxFailure: props<{ error: DbcError }>(),
    
    // Delete
    deleteTax: props<{ id: string }>(),
    deleteTaxSuccess: props<{ id: string }>(),
    deleteTaxFailure: props<{ error: DbcError }>(),

    // Bulk Upload
    uploadBulkTaxes: props<{ file: File }>(),
    uploadBulkTaxesSuccess: props<{ taxes: Tax[] }>(),
    uploadBulkTaxesFailure: props<{ error: DbcError }>()
  }
});
