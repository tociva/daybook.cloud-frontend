// purchase-invoice.actions.ts
import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { PurchaseInvoice, PurchaseInvoiceCU } from './purchase-invoice.model';
import { PurchaseInvoiceRequest } from './purchase-invoice-request.type';

export const purchaseInvoiceActions = createActionGroup({
  source: 'PurchaseInvoice',
  events: {
    // Create
    createPurchaseInvoice: props<{ purchaseInvoice: PurchaseInvoiceRequest }>(),
    createPurchaseInvoiceSuccess: props<{ purchaseInvoice: PurchaseInvoice }>(),
    createPurchaseInvoiceFailure: props<{ error: DbcError }>(),

    // Get by Id
    loadPurchaseInvoiceById: props<{ id: string, query?: QueryParamsRep }>(),
    loadPurchaseInvoiceByIdSuccess: props<{ purchaseInvoice: PurchaseInvoice }>(),
    loadPurchaseInvoiceByIdFailure: props<{ error: DbcError }>(),

    // Get all with optional filter
    loadPurchaseInvoices: props<{ query?: QueryParamsRep }>(),
    loadPurchaseInvoicesSuccess: props<{ purchaseInvoices: PurchaseInvoice[] }>(),
    loadPurchaseInvoicesFailure: props<{ error: DbcError }>(),

    // Count
    countPurchaseInvoices: props<{ query?: QueryParamsRep }>(),
    countPurchaseInvoicesSuccess: props<{ count: Count }>(),
    countPurchaseInvoicesFailure: props<{ error: DbcError }>(),

    // Update
    updatePurchaseInvoice: props<{ id: string; purchaseInvoice: Partial<PurchaseInvoiceRequest> }>() ,
    updatePurchaseInvoiceSuccess: props<{ purchaseInvoice: PurchaseInvoice }>() ,
    updatePurchaseInvoiceFailure: props<{ error: DbcError }>() ,

    // Delete
    deletePurchaseInvoice: props<{ id: string }>() ,
    deletePurchaseInvoiceSuccess: props<{ id: string }>() ,
    deletePurchaseInvoiceFailure: props<{ error: DbcError }>() ,
  }
});

