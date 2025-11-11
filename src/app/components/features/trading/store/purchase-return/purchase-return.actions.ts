// purchase-return.actions.ts
import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { PurchaseReturn, PurchaseReturnCU } from './purchase-return.model';
import { PurchaseReturnRequest } from './purchase-return-request.type';

export const purchaseReturnActions = createActionGroup({
  source: 'PurchaseReturn',
  events: {
    // Create
    createPurchaseReturn: props<{ purchaseReturn: PurchaseReturnRequest }>(),
    createPurchaseReturnSuccess: props<{ purchaseReturn: PurchaseReturn }>(),
    createPurchaseReturnFailure: props<{ error: DbcError }>(),

    // Get by Id
    loadPurchaseReturnById: props<{ id: string, query?: QueryParamsRep }>(),
    loadPurchaseReturnByIdSuccess: props<{ purchaseReturn: PurchaseReturn }>(),
    loadPurchaseReturnByIdFailure: props<{ error: DbcError }>(),

    // Get all with optional filter
    loadPurchaseReturns: props<{ query?: QueryParamsRep }>(),
    loadPurchaseReturnsSuccess: props<{ purchaseReturns: PurchaseReturn[] }>(),
    loadPurchaseReturnsFailure: props<{ error: DbcError }>(),

    // Count
    countPurchaseReturns: props<{ query?: QueryParamsRep }>(),
    countPurchaseReturnsSuccess: props<{ count: Count }>(),
    countPurchaseReturnsFailure: props<{ error: DbcError }>(),

    // Update
    updatePurchaseReturn: props<{ id: string; purchaseReturn: Partial<PurchaseReturnRequest> }>() ,
    updatePurchaseReturnSuccess: props<{ purchaseReturn: PurchaseReturn }>() ,
    updatePurchaseReturnFailure: props<{ error: DbcError }>() ,

    // Delete
    deletePurchaseReturn: props<{ id: string }>() ,
    deletePurchaseReturnSuccess: props<{ id: string }>() ,
    deletePurchaseReturnFailure: props<{ error: DbcError }>() ,
  }
});

