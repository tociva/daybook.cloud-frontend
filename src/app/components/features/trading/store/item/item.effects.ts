import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { itemActions } from './item.actions';
import { Item } from './item.model';
import { ItemStore } from './item.store';

export const itemEffects = {
  // Create Item effect
  createItem: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(itemActions.createItem),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/item`;
          const requestId = `${itemActions.createItem.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.item,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Item> = {
            requestId,
            actionName: 'createItem',
            successMessage: 'Item created successfully!',
            errorMessage: 'Failed to create item',
            onSuccessAction: (item) => itemActions.createItemSuccess({ item }),
            onErrorAction: (error) => itemActions.createItemFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load Item by Id effect
  loadItemById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(itemActions.loadItemById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/item/${action.id}`;
          const requestId = `${itemActions.loadItemById.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Item> = {
            requestId,
            actionName: 'loadItemById',
            errorMessage: 'Failed to load item',
            onSuccessAction: (item) => itemActions.loadItemByIdSuccess({ item }),
            onErrorAction: (error) => itemActions.loadItemByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all Items effect
  loadItems: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(itemActions.loadItems),
        tap((action) => {
          const { limit, offset, search, sort } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? {query: '', fields: []}, sort ?? [], {})
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/item`;
          const requestId = `${itemActions.loadItems.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Item[]> = {
            requestId,
            actionName: 'loadItems',
            errorMessage: 'Failed to load items',
            onSuccessAction: (items) => itemActions.loadItemsSuccess({ items }),
            onErrorAction: (error) => itemActions.loadItemsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count Items effect
  countItems: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(itemActions.countItems),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/item/count`;
          const requestId = `${itemActions.countItems.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countItems',
            errorMessage: 'Failed to count items',
            onSuccessAction: (count) => itemActions.countItemsSuccess({ count }),
            onErrorAction: (error) => itemActions.countItemsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update Item effect
  updateItem: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(itemActions.updateItem),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/item/${action.id}`;
          const requestId = `${itemActions.updateItem.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.item,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Item> = {
            requestId,
            actionName: 'updateItem',
            successMessage: 'Item updated successfully!',
            errorMessage: 'Failed to update item',
            onSuccessAction: (item) => itemActions.updateItemSuccess({ item }),
            onErrorAction: (error) => itemActions.updateItemFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete Item effect
  deleteItem: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(itemActions.deleteItem),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/item/${action.id}`;
          const requestId = `${itemActions.deleteItem.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteItem',
            successMessage: 'Item deleted successfully!',
            errorMessage: 'Failed to delete item',
            onSuccessAction: () => itemActions.deleteItemSuccess({ id: action.id }),
            onErrorAction: (error) => itemActions.deleteItemFailure({ error }),
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
      const store = inject(ItemStore);

      return actions$.pipe(
        ofType(itemActions.createItemSuccess),
        tap(({ item }) => {
          store.setItems([item, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(ItemStore);

      return actions$.pipe(
        ofType(itemActions.loadItemByIdSuccess),
        tap(({ item }) => {
          store.setSelectedItem(item);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadItemsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(ItemStore);

      return actions$.pipe(
        ofType(itemActions.loadItemsSuccess),
        tap(({ items }) => {
          store.setItems(items);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countItemsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(ItemStore);

      return actions$.pipe(
        ofType(itemActions.countItemsSuccess),
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
      const store = inject(ItemStore);

      return actions$.pipe(
        ofType(itemActions.updateItemSuccess),
        tap(({ item }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === item?.id ? item : item
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
      const store = inject(ItemStore);

      return actions$.pipe(
        ofType(itemActions.deleteItemSuccess),
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
      const store = inject(ItemStore);

      return actions$.pipe(
        ofType(itemActions.createItemFailure),
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
      const store = inject(ItemStore);

      return actions$.pipe(
        ofType(itemActions.loadItemByIdFailure),
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
      const store = inject(ItemStore);

      return actions$.pipe(
        ofType(itemActions.loadItemsFailure),
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
      const store = inject(ItemStore);

      return actions$.pipe(
        ofType(itemActions.updateItemFailure),
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
      const store = inject(ItemStore);

      return actions$.pipe(
        ofType(itemActions.deleteItemFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};
