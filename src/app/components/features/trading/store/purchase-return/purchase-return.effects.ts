// purchase-return.effects.ts
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { purchaseReturnActions } from './purchase-return.actions';
import { PurchaseReturn } from './purchase-return.model';
import { PurchaseReturnStore } from './purchase-return.store';

const resourcePath = '/inventory/purchase-return';

export const purchaseReturnEffects = {
  // Create
  createPurchaseReturn: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(purchaseReturnActions.createPurchaseReturn),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}`;
          const requestId = `${purchaseReturnActions.createPurchaseReturn.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.purchaseReturn,
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<PurchaseReturn> = {
            requestId,
            actionName: 'createPurchaseReturn',
            successMessage: 'Purchase Return created successfully!',
            errorMessage: 'Failed to create purchase return',
            onSuccessAction: (purchaseReturn) => purchaseReturnActions.createPurchaseReturnSuccess({ purchaseReturn }),
            onErrorAction: (error) => purchaseReturnActions.createPurchaseReturnFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load by Id
  loadPurchaseReturnById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(purchaseReturnActions.loadPurchaseReturnById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}/${action.id}`;
          const requestId = `${purchaseReturnActions.loadPurchaseReturnById.type}-${Date.now()}-${Math.random()}`;
          const filter = LB4QueryBuilder.create()
            .applySignalStoreIncludes(action.query?.includes)
            .build();
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: { filter: JSON.stringify(filter) },
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<PurchaseReturn> = {
            requestId,
            actionName: 'loadPurchaseReturnById',
            errorMessage: 'Failed to load purchase return',
            onSuccessAction: (purchaseReturn) => purchaseReturnActions.loadPurchaseReturnByIdSuccess({ purchaseReturn }),
            onErrorAction: (error) => purchaseReturnActions.loadPurchaseReturnByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all
  loadPurchaseReturns: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(purchaseReturnActions.loadPurchaseReturns),
        tap((action) => {
          const { limit, offset, search, sort, includes } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
            .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? [{query: '', fields: []}], sort ?? [], includes)
            .build();
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}`;
          const requestId = `${purchaseReturnActions.loadPurchaseReturns.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: { filter: JSON.stringify(filter) },
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<PurchaseReturn[]> = {
            requestId,
            actionName: 'loadPurchaseReturns',
            errorMessage: 'Failed to load purchase returns',
            onSuccessAction: (purchaseReturns) => purchaseReturnActions.loadPurchaseReturnsSuccess({ purchaseReturns }),
            onErrorAction: (error) => purchaseReturnActions.loadPurchaseReturnsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count
  countPurchaseReturns: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(purchaseReturnActions.countPurchaseReturns),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}/count`;
          const requestId = `${purchaseReturnActions.countPurchaseReturns.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: action.query,
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<Count> = {
            requestId,
            actionName: 'countPurchaseReturns',
            errorMessage: 'Failed to count purchase returns',
            onSuccessAction: (count) => purchaseReturnActions.countPurchaseReturnsSuccess({ count }),
            onErrorAction: (error) => purchaseReturnActions.countPurchaseReturnsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update
  updatePurchaseReturn: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(purchaseReturnActions.updatePurchaseReturn),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}/${action.id}`;
          const requestId = `${purchaseReturnActions.updatePurchaseReturn.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.purchaseReturn,
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<PurchaseReturn> = {
            requestId,
            actionName: 'updatePurchaseReturn',
            successMessage: 'Purchase Return updated successfully!',
            errorMessage: 'Failed to update purchase return',
            onSuccessAction: (purchaseReturn) => purchaseReturnActions.updatePurchaseReturnSuccess({ purchaseReturn }),
            onErrorAction: (error) => purchaseReturnActions.updatePurchaseReturnFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete
  deletePurchaseReturn: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(purchaseReturnActions.deletePurchaseReturn),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}/${action.id}`;
          const requestId = `${purchaseReturnActions.deletePurchaseReturn.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deletePurchaseReturn',
            successMessage: 'Purchase Return deleted successfully!',
            errorMessage: 'Failed to delete purchase return',
            onSuccessAction: () => purchaseReturnActions.deletePurchaseReturnSuccess({ id: action.id }),
            onErrorAction: (error) => purchaseReturnActions.deletePurchaseReturnFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Success reducers (Signal Store side-effects)
  createSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseReturnStore);

      return actions$.pipe(
        ofType(purchaseReturnActions.createPurchaseReturnSuccess),
        tap(({ purchaseReturn }) => {
          store.setItems([purchaseReturn, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseReturnStore);

      return actions$.pipe(
        ofType(purchaseReturnActions.loadPurchaseReturnByIdSuccess),
        tap(({ purchaseReturn }) => {
          const {items, ...rest} = purchaseReturn;
          const nItems = [...(items ?? [])]?.sort((a, b) => a.order - b.order) ?? [];
          store.setSelectedItem({...rest, items: nItems});
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadAllSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseReturnStore);

      return actions$.pipe(
        ofType(purchaseReturnActions.loadPurchaseReturnsSuccess),
        tap(({ purchaseReturns }) => {
          store.setItems(purchaseReturns);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseReturnStore);

      return actions$.pipe(
        ofType(purchaseReturnActions.countPurchaseReturnsSuccess),
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
      return actions$.pipe(
        ofType(purchaseReturnActions.updatePurchaseReturnSuccess)
      );
    },
    { functional: true, dispatch: false }
  ),

  deleteSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseReturnStore);

      return actions$.pipe(
        ofType(purchaseReturnActions.deletePurchaseReturnSuccess),
        tap(({ id }) => {
          store.setItems(store.items().filter(pr => pr.id !== id));
          const selected = store.selectedItem?.();
          if (selected?.id === id) {
            store.setSelectedItem(null as unknown as PurchaseReturn);
          }
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Failure reducers
  createFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseReturnStore);
      return actions$.pipe(
        ofType(purchaseReturnActions.createPurchaseReturnFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseReturnStore);
      return actions$.pipe(
        ofType(purchaseReturnActions.loadPurchaseReturnByIdFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),

  loadAllFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseReturnStore);
      return actions$.pipe(
        ofType(purchaseReturnActions.loadPurchaseReturnsFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),

  updateFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseReturnStore);
      return actions$.pipe(
        ofType(purchaseReturnActions.updatePurchaseReturnFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),

  deleteFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseReturnStore);
      return actions$.pipe(
        ofType(purchaseReturnActions.deletePurchaseReturnFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),
};

