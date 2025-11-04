import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { vendorPaymentActions } from './vendor-payment.actions';
import { VendorPayment } from './vendor-payment.model';
import { VendorPaymentStore } from './vendor-payment.store';

export const vendorPaymentEffects = {
  // Create VendorPayment effect
  createVendorPayment: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(vendorPaymentActions.createVendorPayment),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/vendor-payment`;
          const requestId = `${vendorPaymentActions.createVendorPayment.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.vendorPayment,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<VendorPayment> = {
            requestId,
            actionName: 'createVendorPayment',
            successMessage: 'Vendor payment created successfully!',
            errorMessage: 'Failed to create vendor payment',
            onSuccessAction: (vendorPayment) => vendorPaymentActions.createVendorPaymentSuccess({ vendorPayment }),
            onErrorAction: (error) => vendorPaymentActions.createVendorPaymentFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load VendorPayment by Id effect
  loadVendorPaymentById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(vendorPaymentActions.loadVendorPaymentById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/vendor-payment/${action.id}`;
          const requestId = `${vendorPaymentActions.loadVendorPaymentById.type}-${Date.now()}-${Math.random()}`;
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
          const metadata: HttpRequestMetadata<VendorPayment> = {
            requestId,
            actionName: 'loadVendorPaymentById',
            errorMessage: 'Failed to load vendor payment',
            onSuccessAction: (vendorPayment) => vendorPaymentActions.loadVendorPaymentByIdSuccess({ vendorPayment }),
            onErrorAction: (error) => vendorPaymentActions.loadVendorPaymentByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all VendorPayments effect
  loadVendorPayments: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(vendorPaymentActions.loadVendorPayments),
        tap((action) => {
          const { limit, offset, search, sort, includes } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? [{query: '', fields: []}], sort ?? [], includes)
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/vendor-payment`;
          const requestId = `${vendorPaymentActions.loadVendorPayments.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<VendorPayment[]> = {
            requestId,
            actionName: 'loadVendorPayments',
            errorMessage: 'Failed to load vendor payments',
            onSuccessAction: (vendorPayments) => vendorPaymentActions.loadVendorPaymentsSuccess({ vendorPayments }),
            onErrorAction: (error) => vendorPaymentActions.loadVendorPaymentsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count VendorPayments effect
  countVendorPayments: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(vendorPaymentActions.countVendorPayments),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/vendor-payment/count`;
          const requestId = `${vendorPaymentActions.countVendorPayments.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countVendorPayments',
            errorMessage: 'Failed to count vendor payments',
            onSuccessAction: (count) => vendorPaymentActions.countVendorPaymentsSuccess({ count }),
            onErrorAction: (error) => vendorPaymentActions.countVendorPaymentsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update VendorPayment effect
  updateVendorPayment: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(vendorPaymentActions.updateVendorPayment),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/vendor-payment/${action.id}`;
          const requestId = `${vendorPaymentActions.updateVendorPayment.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.vendorPayment,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<VendorPayment> = {
            requestId,
            actionName: 'updateVendorPayment',
            successMessage: 'Vendor payment updated successfully!',
            errorMessage: 'Failed to update vendor payment',
            onSuccessAction: (vendorPayment) => vendorPaymentActions.updateVendorPaymentSuccess({ vendorPayment }),
            onErrorAction: (error) => vendorPaymentActions.updateVendorPaymentFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete VendorPayment effect
  deleteVendorPayment: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(vendorPaymentActions.deleteVendorPayment),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/vendor-payment/${action.id}`;
          const requestId = `${vendorPaymentActions.deleteVendorPayment.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteVendorPayment',
            successMessage: 'Vendor payment deleted successfully!',
            errorMessage: 'Failed to delete vendor payment',
            onSuccessAction: () => vendorPaymentActions.deleteVendorPaymentSuccess({ id: action.id }),
            onErrorAction: (error) => vendorPaymentActions.deleteVendorPaymentFailure({ error }),
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
      const store = inject(VendorPaymentStore);

      return actions$.pipe(
        ofType(vendorPaymentActions.createVendorPaymentSuccess),
        tap(({ vendorPayment }) => {
          store.setItems([vendorPayment, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(VendorPaymentStore);

      return actions$.pipe(
        ofType(vendorPaymentActions.loadVendorPaymentByIdSuccess),
        tap(({ vendorPayment }) => {
          store.setSelectedItem(vendorPayment);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadVendorPaymentsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(VendorPaymentStore);

      return actions$.pipe(
        ofType(vendorPaymentActions.loadVendorPaymentsSuccess),
        tap(({ vendorPayments }) => {
          store.setItems(vendorPayments);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countVendorPaymentsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(VendorPaymentStore);

      return actions$.pipe(
        ofType(vendorPaymentActions.countVendorPaymentsSuccess),
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
      const store = inject(VendorPaymentStore);

      return actions$.pipe(
        ofType(vendorPaymentActions.updateVendorPaymentSuccess),
        tap(({ vendorPayment }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === vendorPayment?.id ? vendorPayment : item
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
      const store = inject(VendorPaymentStore);

      return actions$.pipe(
        ofType(vendorPaymentActions.deleteVendorPaymentSuccess),
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
      const store = inject(VendorPaymentStore);

      return actions$.pipe(
        ofType(vendorPaymentActions.createVendorPaymentFailure),
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
      const store = inject(VendorPaymentStore);

      return actions$.pipe(
        ofType(vendorPaymentActions.loadVendorPaymentByIdFailure),
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
      const store = inject(VendorPaymentStore);

      return actions$.pipe(
        ofType(vendorPaymentActions.loadVendorPaymentsFailure),
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
      const store = inject(VendorPaymentStore);

      return actions$.pipe(
        ofType(vendorPaymentActions.updateVendorPaymentFailure),
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
      const store = inject(VendorPaymentStore);

      return actions$.pipe(
        ofType(vendorPaymentActions.deleteVendorPaymentFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};

