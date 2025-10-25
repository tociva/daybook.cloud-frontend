// sale-invoice.actions.ts
import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { SaleInvoice, SaleInvoiceCU } from './sale-invoice.model';
import { SaleInvoiceRequest } from './sale-invoice-request.type';

export const saleInvoiceActions = createActionGroup({
  source: 'SaleInvoice',
  events: {
    // Create
    createSaleInvoice: props<{ saleInvoice: SaleInvoiceRequest }>(),
    createSaleInvoiceSuccess: props<{ saleInvoice: SaleInvoice }>(),
    createSaleInvoiceFailure: props<{ error: DbcError }>(),

    // Get by Id
    loadSaleInvoiceById: props<{ id: string, query?: QueryParamsRep }>(),
    loadSaleInvoiceByIdSuccess: props<{ saleInvoice: SaleInvoice }>(),
    loadSaleInvoiceByIdFailure: props<{ error: DbcError }>(),

    // Get all with optional filter
    loadSaleInvoices: props<{ query?: QueryParamsRep }>(),
    loadSaleInvoicesSuccess: props<{ saleInvoices: SaleInvoice[] }>(),
    loadSaleInvoicesFailure: props<{ error: DbcError }>(),

    // Count
    countSaleInvoices: props<{ query?: QueryParamsRep }>(),
    countSaleInvoicesSuccess: props<{ count: Count }>(),
    countSaleInvoicesFailure: props<{ error: DbcError }>(),

    // Update
    updateSaleInvoice: props<{ id: string; saleInvoice: Partial<SaleInvoiceRequest> }>() ,
    updateSaleInvoiceSuccess: props<{ saleInvoice: SaleInvoice }>() ,
    updateSaleInvoiceFailure: props<{ error: DbcError }>() ,

    // Delete
    deleteSaleInvoice: props<{ id: string }>() ,
    deleteSaleInvoiceSuccess: props<{ id: string }>() ,
    deleteSaleInvoiceFailure: props<{ error: DbcError }>() ,
  }
});
