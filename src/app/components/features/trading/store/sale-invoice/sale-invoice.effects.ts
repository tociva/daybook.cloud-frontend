// sale-invoice.effects.ts
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { saleInvoiceActions } from './sale-invoice.actions';
import { SaleInvoice } from './sale-invoice.model';
import { SaleInvoiceStore } from './sale-invoice.store';

const resourcePath = '/inventory/sale-invoice';

export const saleInvoiceEffects = {
  // Create
  createSaleInvoice: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(saleInvoiceActions.createSaleInvoice),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}`;
          const requestId = `${saleInvoiceActions.createSaleInvoice.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.saleInvoice,
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<SaleInvoice> = {
            requestId,
            actionName: 'createSaleInvoice',
            successMessage: 'Sale Invoice created successfully!',
            errorMessage: 'Failed to create sale invoice',
            onSuccessAction: (saleInvoice) => saleInvoiceActions.createSaleInvoiceSuccess({ saleInvoice }),
            onErrorAction: (error) => saleInvoiceActions.createSaleInvoiceFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load by Id
  loadSaleInvoiceById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(saleInvoiceActions.loadSaleInvoiceById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}/${action.id}`;
          const requestId = `${saleInvoiceActions.loadSaleInvoiceById.type}-${Date.now()}-${Math.random()}`;
          const filter = LB4QueryBuilder.create()
            .applySignalStoreIncludes(action.query?.includes)
            .build();
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: { filter: JSON.stringify(filter) },
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<SaleInvoice> = {
            requestId,
            actionName: 'loadSaleInvoiceById',
            errorMessage: 'Failed to load sale invoice',
            onSuccessAction: (saleInvoice) => saleInvoiceActions.loadSaleInvoiceByIdSuccess({ saleInvoice }),
            onErrorAction: (error) => saleInvoiceActions.loadSaleInvoiceByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all
  loadSaleInvoices: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(saleInvoiceActions.loadSaleInvoices),
        tap((action) => {
          const { limit, offset, search, sort, includes } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
            .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? { query: '', fields: [] }, sort ?? [], includes)
            .build();
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}`;
          const requestId = `${saleInvoiceActions.loadSaleInvoices.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: { filter: JSON.stringify(filter) },
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<SaleInvoice[]> = {
            requestId,
            actionName: 'loadSaleInvoices',
            errorMessage: 'Failed to load sale invoices',
            onSuccessAction: (saleInvoices) => saleInvoiceActions.loadSaleInvoicesSuccess({ saleInvoices }),
            onErrorAction: (error) => saleInvoiceActions.loadSaleInvoicesFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count
  countSaleInvoices: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(saleInvoiceActions.countSaleInvoices),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}/count`;
          const requestId = `${saleInvoiceActions.countSaleInvoices.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: action.query,
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<Count> = {
            requestId,
            actionName: 'countSaleInvoices',
            errorMessage: 'Failed to count sale invoices',
            onSuccessAction: (count) => saleInvoiceActions.countSaleInvoicesSuccess({ count }),
            onErrorAction: (error) => saleInvoiceActions.countSaleInvoicesFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update
  updateSaleInvoice: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(saleInvoiceActions.updateSaleInvoice),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}/${action.id}`;
          const requestId = `${saleInvoiceActions.updateSaleInvoice.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.saleInvoice,
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<SaleInvoice> = {
            requestId,
            actionName: 'updateSaleInvoice',
            successMessage: 'Sale Invoice updated successfully!',
            errorMessage: 'Failed to update sale invoice',
            onSuccessAction: (saleInvoice) => saleInvoiceActions.updateSaleInvoiceSuccess({ saleInvoice }),
            onErrorAction: (error) => saleInvoiceActions.updateSaleInvoiceFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete
  deleteSaleInvoice: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(saleInvoiceActions.deleteSaleInvoice),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}${resourcePath}/${action.id}`;
          const requestId = `${saleInvoiceActions.deleteSaleInvoice.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteSaleInvoice',
            successMessage: 'Sale Invoice deleted successfully!',
            errorMessage: 'Failed to delete sale invoice',
            onSuccessAction: () => saleInvoiceActions.deleteSaleInvoiceSuccess({ id: action.id }),
            onErrorAction: (error) => saleInvoiceActions.deleteSaleInvoiceFailure({ error }),
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
      const store = inject(SaleInvoiceStore);

      return actions$.pipe(
        ofType(saleInvoiceActions.createSaleInvoiceSuccess),
        tap(({ saleInvoice }) => {
          store.setItems([saleInvoice, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(SaleInvoiceStore);

      return actions$.pipe(
        ofType(saleInvoiceActions.loadSaleInvoiceByIdSuccess),
        tap(({ saleInvoice }) => {
          store.setSelectedItem(saleInvoice);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadAllSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(SaleInvoiceStore);

      return actions$.pipe(
        ofType(saleInvoiceActions.loadSaleInvoicesSuccess),
        tap(({ saleInvoices }) => {
          store.setItems(saleInvoices);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(SaleInvoiceStore);

      return actions$.pipe(
        ofType(saleInvoiceActions.countSaleInvoicesSuccess),
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
      const store = inject(SaleInvoiceStore);

      return actions$.pipe(
        ofType(saleInvoiceActions.updateSaleInvoiceSuccess),
        tap(({ saleInvoice }) => {
          const current = store.items();
          const updated = current.map(inv => inv.id === saleInvoice.id ? saleInvoice : inv);
          store.setItems(updated);

          // if the updated invoice is currently selected, refresh it as well
          const selected = store.selectedItem?.();
          if (selected && selected.id === saleInvoice.id) {
            store.setSelectedItem(saleInvoice);
          }
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  deleteSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(SaleInvoiceStore);

      return actions$.pipe(
        ofType(saleInvoiceActions.deleteSaleInvoiceSuccess),
        tap(({ id }) => {
          store.setItems(store.items().filter(inv => inv.id !== id));
          const selected = store.selectedItem?.();
          if (selected?.id === id) {
            store.setSelectedItem(null as unknown as SaleInvoice); // or a dedicated clear method depending on your base store
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
      const store = inject(SaleInvoiceStore);
      return actions$.pipe(
        ofType(saleInvoiceActions.createSaleInvoiceFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(SaleInvoiceStore);
      return actions$.pipe(
        ofType(saleInvoiceActions.loadSaleInvoiceByIdFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),

  loadAllFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(SaleInvoiceStore);
      return actions$.pipe(
        ofType(saleInvoiceActions.loadSaleInvoicesFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),

  updateFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(SaleInvoiceStore);
      return actions$.pipe(
        ofType(saleInvoiceActions.updateSaleInvoiceFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),

  deleteFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(SaleInvoiceStore);
      return actions$.pipe(
        ofType(saleInvoiceActions.deleteSaleInvoiceFailure),
        tap(({ error }) => store.setError(error))
      );
    },
    { functional: true, dispatch: false }
  ),
};
