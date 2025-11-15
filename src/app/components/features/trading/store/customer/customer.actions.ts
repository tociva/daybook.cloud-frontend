import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { Customer, CustomerCU } from './customer.model';

export const customerActions = createActionGroup({
  source: 'Customer',
  events: {
    // Create
    createCustomer: props<{ customer: CustomerCU }>(),
    createCustomerSuccess: props<{ customer: Customer }>(),
    createCustomerFailure: props<{ error: DbcError }>(),
    
    // Get by Id
    loadCustomerById: props<{ id: string, query?: unknown }>(),
    loadCustomerByIdSuccess: props<{ customer: Customer }>(),
    loadCustomerByIdFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter
    loadCustomers: props<{ query?: QueryParamsRep }>(),
    loadCustomersSuccess: props<{ customers: Customer[] }>(),
    loadCustomersFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter 
    countCustomers: props<{ query?: QueryParamsRep }>(),
    countCustomersSuccess: props<{ count: Count }>(),
    countCustomersFailure: props<{ error: DbcError }>(),
    
    // Patch/Update
    updateCustomer: props<{ id: string; customer: CustomerCU }>(),
    updateCustomerSuccess: props<{ customer: Customer }>(),
    updateCustomerFailure: props<{ error: DbcError }>(),
    
    // Delete
    deleteCustomer: props<{ id: string }>(),
    deleteCustomerSuccess: props<{ id: string }>(),
    deleteCustomerFailure: props<{ error: DbcError }>(),

    // Bulk Upload
    uploadBulkCustomers: props<{ file: File }>(),
    uploadBulkCustomersSuccess: props<{ customers: Customer[] }>(),
    uploadBulkCustomersFailure: props<{ error: DbcError }>()
  }
});
