import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { VendorPayment, VendorPaymentCU } from './vendor-payment.model';

export const vendorPaymentActions = createActionGroup({
  source: 'VendorPayment',
  events: {
    // Create
    createVendorPayment: props<{ vendorPayment: VendorPaymentCU }>(),
    createVendorPaymentSuccess: props<{ vendorPayment: VendorPayment }>(),
    createVendorPaymentFailure: props<{ error: DbcError }>(),
    
    // Get by Id
    loadVendorPaymentById: props<{ id: string, query?: QueryParamsRep }>(),
    loadVendorPaymentByIdSuccess: props<{ vendorPayment: VendorPayment }>(),
    loadVendorPaymentByIdFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter
    loadVendorPayments: props<{ query?: QueryParamsRep }>(),
    loadVendorPaymentsSuccess: props<{ vendorPayments: VendorPayment[] }>(),
    loadVendorPaymentsFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter 
    countVendorPayments: props<{ query?: QueryParamsRep }>(),
    countVendorPaymentsSuccess: props<{ count: Count }>(),
    countVendorPaymentsFailure: props<{ error: DbcError }>(),
    
    // Patch/Update
    updateVendorPayment: props<{ id: string; vendorPayment: VendorPaymentCU }>(),
    updateVendorPaymentSuccess: props<{ vendorPayment: VendorPayment }>(),
    updateVendorPaymentFailure: props<{ error: DbcError }>(),
    
    // Delete
    deleteVendorPayment: props<{ id: string }>(),
    deleteVendorPaymentSuccess: props<{ id: string }>(),
    deleteVendorPaymentFailure: props<{ error: DbcError }>()
  }
});

