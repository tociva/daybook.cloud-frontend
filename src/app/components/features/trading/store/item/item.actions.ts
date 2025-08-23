import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { Item, ItemCU } from './item.model';

export const itemActions = createActionGroup({
  source: 'Item',
  events: {
    // Create
    createItem: props<{ item: ItemCU }>(),
    createItemSuccess: props<{ item: Item }>(),
    createItemFailure: props<{ error: DbcError }>(),
    
    // Get by Id
    loadItemById: props<{ id: string, query?: QueryParamsRep }>(),
    loadItemByIdSuccess: props<{ item: Item }>(),
    loadItemByIdFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter
    loadItems: props<{ query?: QueryParamsRep }>(),
    loadItemsSuccess: props<{ items: Item[] }>(),
    loadItemsFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter 
    countItems: props<{ query?: QueryParamsRep }>(),
    countItemsSuccess: props<{ count: Count }>(),
    countItemsFailure: props<{ error: DbcError }>(),
    
    // Patch/Update
    updateItem: props<{ id: string; item: ItemCU }>(),
    updateItemSuccess: props<{ item: Item }>(),
    updateItemFailure: props<{ error: DbcError }>(),
    
    // Delete
    deleteItem: props<{ id: string }>(),
    deleteItemSuccess: props<{ id: string }>(),
    deleteItemFailure: props<{ error: DbcError }>()
  }
});
