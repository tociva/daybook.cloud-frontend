import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { CustomerReceipt, CustomerReceiptCU } from './customer-receipt.model';

export const customerReceiptActions = createActionGroup({
  source: 'CustomerReceipt',
  events: {
    // Create
    createCustomerReceipt: props<{ customerReceipt: CustomerReceiptCU }>(),
    createCustomerReceiptSuccess: props<{ customerReceipt: CustomerReceipt }>(),
    createCustomerReceiptFailure: props<{ error: DbcError }>(),
    
    // Get by Id
    loadCustomerReceiptById: props<{ id: string, query?: QueryParamsRep }>(),
    loadCustomerReceiptByIdSuccess: props<{ customerReceipt: CustomerReceipt }>(),
    loadCustomerReceiptByIdFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter
    loadCustomerReceipts: props<{ query?: QueryParamsRep }>(),
    loadCustomerReceiptsSuccess: props<{ customerReceipts: CustomerReceipt[] }>(),
    loadCustomerReceiptsFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter 
    countCustomerReceipts: props<{ query?: QueryParamsRep }>(),
    countCustomerReceiptsSuccess: props<{ count: Count }>(),
    countCustomerReceiptsFailure: props<{ error: DbcError }>(),
    
    // Patch/Update
    updateCustomerReceipt: props<{ id: string; customerReceipt: CustomerReceiptCU }>(),
    updateCustomerReceiptSuccess: props<{ customerReceipt: CustomerReceipt }>(),
    updateCustomerReceiptFailure: props<{ error: DbcError }>(),
    
    // Delete
    deleteCustomerReceipt: props<{ id: string }>(),
    deleteCustomerReceiptSuccess: props<{ id: string }>(),
    deleteCustomerReceiptFailure: props<{ error: DbcError }>()
  }
});

