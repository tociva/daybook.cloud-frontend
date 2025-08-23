import { createActionGroup, props } from '@ngrx/store';
import { Count } from '../../../../../util/lb4-query-builder';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { ItemCategory, ItemCategoryCU } from './item-category.model';

export const itemCategoryActions = createActionGroup({
  source: 'ItemCategory',
  events: {
    // Create
    createItemCategory: props<{ itemCategory: ItemCategoryCU }>(),
    createItemCategorySuccess: props<{ itemCategory: ItemCategory }>(),
    createItemCategoryFailure: props<{ error: DbcError }>(),
    
    // Get by Id
    loadItemCategoryById: props<{ id: string, query?: QueryParamsRep }>(),
    loadItemCategoryByIdSuccess: props<{ itemCategory: ItemCategory }>(),
    loadItemCategoryByIdFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter
    loadItemCategories: props<{ query?: QueryParamsRep }>(),
    loadItemCategoriesSuccess: props<{ itemCategories: ItemCategory[] }>(),
    loadItemCategoriesFailure: props<{ error: DbcError }>(),
    
    // Get all with optional filter 
    countItemCategories: props<{ query?: QueryParamsRep }>(),
    countItemCategoriesSuccess: props<{ count: Count }>(),
    countItemCategoriesFailure: props<{ error: DbcError }>(),
    
    // Patch/Update
    updateItemCategory: props<{ id: string; itemCategory: ItemCategoryCU }>(),
    updateItemCategorySuccess: props<{ itemCategory: ItemCategory }>(),
    updateItemCategoryFailure: props<{ error: DbcError }>(),
    
    // Delete
    deleteItemCategory: props<{ id: string }>(),
    deleteItemCategorySuccess: props<{ id: string }>(),
    deleteItemCategoryFailure: props<{ error: DbcError }>()
  }
});
