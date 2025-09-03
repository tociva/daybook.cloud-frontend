import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { Vendor, VendorCU } from './vendor.model';

export const vendorActions = createActionGroup({
  source: 'Vendor',
  events: {
    // Create
    createVendor: props<{ vendor: VendorCU }>(),
    createVendorSuccess: props<{ vendor: Vendor }>(),
    createVendorFailure: props<{ error: DbcError }>(),
    
    // Get by Id
    loadVendorById: props<{ id: string, query?: unknown }>(),
    loadVendorByIdSuccess: props<{ vendor: Vendor }>(),
    loadVendorByIdFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter
    loadVendors: props<{ query?: QueryParamsRep }>(),
    loadVendorsSuccess: props<{ vendors: Vendor[] }>(),
    loadVendorsFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter 
    countVendors: props<{ query?: QueryParamsRep }>(),
    countVendorsSuccess: props<{ count: Count }>(),
    countVendorsFailure: props<{ error: DbcError }>(),
    
    // Patch/Update
    updateVendor: props<{ id: string; vendor: VendorCU }>(),
    updateVendorSuccess: props<{ vendor: Vendor }>(),
    updateVendorFailure: props<{ error: DbcError }>(),
    
    // Delete
    deleteVendor: props<{ id: string }>(),
    deleteVendorSuccess: props<{ id: string }>(),
    deleteVendorFailure: props<{ error: DbcError }>()
  }
});
