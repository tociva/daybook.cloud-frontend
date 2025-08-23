import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { itemCategoryActions } from './item-category.actions';
import { ItemCategory } from './item-category.model';
import { ItemCategoryStore } from './item-category.store';

export const itemCategoryEffects = {
  // Create ItemCategory effect
  createItemCategory: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(itemCategoryActions.createItemCategory),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/item-category`;
          const requestId = `${itemCategoryActions.createItemCategory.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.itemCategory,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<ItemCategory> = {
            requestId,
            actionName: 'createItemCategory',
            successMessage: 'Item category created successfully!',
            errorMessage: 'Failed to create item category',
            onSuccessAction: (itemCategory) => itemCategoryActions.createItemCategorySuccess({ itemCategory }),
            onErrorAction: (error) => itemCategoryActions.createItemCategoryFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load ItemCategory by Id effect
  loadItemCategoryById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(itemCategoryActions.loadItemCategoryById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/item-category/${action.id}`;
          const requestId = `${itemCategoryActions.loadItemCategoryById.type}-${Date.now()}-${Math.random()}`;
          const filter = LB4QueryBuilder.create()
          .applySignalStoreIncludes(action.query?.includes)
          .build();
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<ItemCategory> = {
            requestId,
            actionName: 'loadItemCategoryById',
            errorMessage: 'Failed to load item category',
            onSuccessAction: (itemCategory) => itemCategoryActions.loadItemCategoryByIdSuccess({ itemCategory }),
            onErrorAction: (error) => itemCategoryActions.loadItemCategoryByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all ItemCategories effect
  loadItemCategories: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(itemCategoryActions.loadItemCategories),
        tap((action) => {
          const { limit, offset, search, sort, includes } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? {query: '', fields: []}, sort ?? [], includes)
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/item-category`;
          const requestId = `${itemCategoryActions.loadItemCategories.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<ItemCategory[]> = {
            requestId,
            actionName: 'loadItemCategories',
            errorMessage: 'Failed to load item categories',
            onSuccessAction: (itemCategories) => itemCategoryActions.loadItemCategoriesSuccess({ itemCategories }),
            onErrorAction: (error) => itemCategoryActions.loadItemCategoriesFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count ItemCategories effect
  countItemCategories: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(itemCategoryActions.countItemCategories),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/item-category/count`;
          const requestId = `${itemCategoryActions.countItemCategories.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: action.query,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Count> = {
            requestId,
            actionName: 'countItemCategories',
            errorMessage: 'Failed to count item categories',
            onSuccessAction: (count) => itemCategoryActions.countItemCategoriesSuccess({ count }),
            onErrorAction: (error) => itemCategoryActions.countItemCategoriesFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update ItemCategory effect
  updateItemCategory: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(itemCategoryActions.updateItemCategory),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/item-category/${action.id}`;
          const requestId = `${itemCategoryActions.updateItemCategory.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.itemCategory,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<ItemCategory> = {
            requestId,
            actionName: 'updateItemCategory',
            successMessage: 'Item category updated successfully!',
            errorMessage: 'Failed to update item category',
            onSuccessAction: (itemCategory) => itemCategoryActions.updateItemCategorySuccess({ itemCategory }),
            onErrorAction: (error) => itemCategoryActions.updateItemCategoryFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete ItemCategory effect
  deleteItemCategory: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(itemCategoryActions.deleteItemCategory),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/item-category/${action.id}`;
          const requestId = `${itemCategoryActions.deleteItemCategory.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteItemCategory',
            successMessage: 'Item category deleted successfully!',
            errorMessage: 'Failed to delete item category',
            onSuccessAction: () => itemCategoryActions.deleteItemCategorySuccess({ id: action.id }),
            onErrorAction: (error) => itemCategoryActions.deleteItemCategoryFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Success effects
  createSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(ItemCategoryStore);

      return actions$.pipe(
        ofType(itemCategoryActions.createItemCategorySuccess),
        tap(({ itemCategory }) => {
          store.setItems([itemCategory, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(ItemCategoryStore);

      return actions$.pipe(
        ofType(itemCategoryActions.loadItemCategoryByIdSuccess),
        tap(({ itemCategory }) => {
          store.setSelectedItem(itemCategory);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadItemCategoriesSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(ItemCategoryStore);

      return actions$.pipe(
        ofType(itemCategoryActions.loadItemCategoriesSuccess),
        tap(({ itemCategories }) => {
          store.setItems(itemCategories);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countItemCategoriesSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(ItemCategoryStore);

      return actions$.pipe(
        ofType(itemCategoryActions.countItemCategoriesSuccess),
        tap(({ count }) => {
          store.setCount(count.count);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  updateSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(ItemCategoryStore);

      return actions$.pipe(
        ofType(itemCategoryActions.updateItemCategorySuccess),
        tap(({ itemCategory }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === itemCategory?.id ? itemCategory : item
          );
          store.setItems(updatedItems);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  deleteSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(ItemCategoryStore);

      return actions$.pipe(
        ofType(itemCategoryActions.deleteItemCategorySuccess),
        tap(({ id }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.filter(item => item.id !== id);
          store.setItems(updatedItems);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Failure effects
  createFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(ItemCategoryStore);

      return actions$.pipe(
        ofType(itemCategoryActions.createItemCategoryFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(ItemCategoryStore);

      return actions$.pipe(
        ofType(itemCategoryActions.loadItemCategoryByIdFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadAllFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(ItemCategoryStore);

      return actions$.pipe(
        ofType(itemCategoryActions.loadItemCategoriesFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  updateFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(ItemCategoryStore);

      return actions$.pipe(
        ofType(itemCategoryActions.updateItemCategoryFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  deleteFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(ItemCategoryStore);

      return actions$.pipe(
        ofType(itemCategoryActions.deleteItemCategoryFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};
