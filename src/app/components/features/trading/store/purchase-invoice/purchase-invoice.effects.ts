// purchase-invoice.effects.ts
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { purchaseInvoiceActions } from './purchase-invoice.actions';
import { PurchaseInvoice } from './purchase-invoice.model';
import { PurchaseInvoiceStore } from './purchase-invoice.store';

const resourcePath = '/inventory/purchase-invoice';

export const purchaseInvoiceEffects = {
  // Create
  createPurchaseInvoice: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(purchaseInvoiceActions.createPurchaseInvoice),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}`;
          const requestId = `${purchaseInvoiceActions.createPurchaseInvoice.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.purchaseInvoice,
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<PurchaseInvoice> = {
            requestId,
            actionName: 'createPurchaseInvoice',
            successMessage: 'Purchase Invoice created successfully!',
            errorMessage: 'Failed to create purchase invoice',
            onSuccessAction: (purchaseInvoice) => purchaseInvoiceActions.createPurchaseInvoiceSuccess({ purchaseInvoice }),
            onErrorAction: (error) => purchaseInvoiceActions.createPurchaseInvoiceFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load by Id
  loadPurchaseInvoiceById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(purchaseInvoiceActions.loadPurchaseInvoiceById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}/${action.id}`;
          const requestId = `${purchaseInvoiceActions.loadPurchaseInvoiceById.type}-${Date.now()}-${Math.random()}`;
          const filter = LB4QueryBuilder.create()
            .applySignalStoreIncludes(action.query?.includes)
            .build();
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: { filter: JSON.stringify(filter) },
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<PurchaseInvoice> = {
            requestId,
            actionName: 'loadPurchaseInvoiceById',
            errorMessage: 'Failed to load purchase invoice',
            onSuccessAction: (purchaseInvoice) => purchaseInvoiceActions.loadPurchaseInvoiceByIdSuccess({ purchaseInvoice }),
            onErrorAction: (error) => purchaseInvoiceActions.loadPurchaseInvoiceByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all
  loadPurchaseInvoices: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(purchaseInvoiceActions.loadPurchaseInvoices),
        tap((action) => {
          const { limit, offset, search, sort, includes } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
            .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? { query: '', fields: [] }, sort ?? [], includes)
            .build();
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}`;
          const requestId = `${purchaseInvoiceActions.loadPurchaseInvoices.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: { filter: JSON.stringify(filter) },
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<PurchaseInvoice[]> = {
            requestId,
            actionName: 'loadPurchaseInvoices',
            errorMessage: 'Failed to load purchase invoices',
            onSuccessAction: (purchaseInvoices) => purchaseInvoiceActions.loadPurchaseInvoicesSuccess({ purchaseInvoices }),
            onErrorAction: (error) => purchaseInvoiceActions.loadPurchaseInvoicesFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count
  countPurchaseInvoices: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(purchaseInvoiceActions.countPurchaseInvoices),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}/count`;
          const requestId = `${purchaseInvoiceActions.countPurchaseInvoices.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: action.query,
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<Count> = {
            requestId,
            actionName: 'countPurchaseInvoices',
            errorMessage: 'Failed to count purchase invoices',
            onSuccessAction: (count) => purchaseInvoiceActions.countPurchaseInvoicesSuccess({ count }),
            onErrorAction: (error) => purchaseInvoiceActions.countPurchaseInvoicesFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update
  updatePurchaseInvoice: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(purchaseInvoiceActions.updatePurchaseInvoice),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}/${action.id}`;
          const requestId = `${purchaseInvoiceActions.updatePurchaseInvoice.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.purchaseInvoice,
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<PurchaseInvoice> = {
            requestId,
            actionName: 'updatePurchaseInvoice',
            successMessage: 'Purchase Invoice updated successfully!',
            errorMessage: 'Failed to update purchase invoice',
            onSuccessAction: (purchaseInvoice) => purchaseInvoiceActions.updatePurchaseInvoiceSuccess({ purchaseInvoice }),
            onErrorAction: (error) => purchaseInvoiceActions.updatePurchaseInvoiceFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete
  deletePurchaseInvoice: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(purchaseInvoiceActions.deletePurchaseInvoice),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}/${action.id}`;
          const requestId = `${purchaseInvoiceActions.deletePurchaseInvoice.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deletePurchaseInvoice',
            successMessage: 'Purchase Invoice deleted successfully!',
            errorMessage: 'Failed to delete purchase invoice',
            onSuccessAction: () => purchaseInvoiceActions.deletePurchaseInvoiceSuccess({ id: action.id }),
            onErrorAction: (error) => purchaseInvoiceActions.deletePurchaseInvoiceFailure({ error }),
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
      const store = inject(PurchaseInvoiceStore);

      return actions$.pipe(
        ofType(purchaseInvoiceActions.createPurchaseInvoiceSuccess),
        tap(({ purchaseInvoice }) => {
          store.setItems([purchaseInvoice, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseInvoiceStore);

      return actions$.pipe(
        ofType(purchaseInvoiceActions.loadPurchaseInvoiceByIdSuccess),
        tap(({ purchaseInvoice }) => {
          const {items, ...rest} = purchaseInvoice;
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
      const store = inject(PurchaseInvoiceStore);

      return actions$.pipe(
        ofType(purchaseInvoiceActions.loadPurchaseInvoicesSuccess),
        tap(({ purchaseInvoices }) => {
          store.setItems(purchaseInvoices);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseInvoiceStore);

      return actions$.pipe(
        ofType(purchaseInvoiceActions.countPurchaseInvoicesSuccess),
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
        ofType(purchaseInvoiceActions.updatePurchaseInvoiceSuccess)
      );
    },
    { functional: true, dispatch: false }
  ),

  deleteSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseInvoiceStore);

      return actions$.pipe(
        ofType(purchaseInvoiceActions.deletePurchaseInvoiceSuccess),
        tap(({ id }) => {
          store.setItems(store.items().filter(inv => inv.id !== id));
          const selected = store.selectedItem?.();
          if (selected?.id === id) {
            store.setSelectedItem(null as unknown as PurchaseInvoice);
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
      const store = inject(PurchaseInvoiceStore);
      return actions$.pipe(
        ofType(purchaseInvoiceActions.createPurchaseInvoiceFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseInvoiceStore);
      return actions$.pipe(
        ofType(purchaseInvoiceActions.loadPurchaseInvoiceByIdFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),

  loadAllFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseInvoiceStore);
      return actions$.pipe(
        ofType(purchaseInvoiceActions.loadPurchaseInvoicesFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),

  updateFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseInvoiceStore);
      return actions$.pipe(
        ofType(purchaseInvoiceActions.updatePurchaseInvoiceFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),

  deleteFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(PurchaseInvoiceStore);
      return actions$.pipe(
        ofType(purchaseInvoiceActions.deletePurchaseInvoiceFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),
};

