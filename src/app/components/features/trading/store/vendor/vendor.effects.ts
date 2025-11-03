import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { vendorActions } from './vendor.actions';
import { Vendor } from './vendor.model';
import { VendorStore } from './vendor.store';

export const vendorEffects = {
  // Create Vendor effect
  createVendor: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(vendorActions.createVendor),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/vendor`;
          const requestId = `${vendorActions.createVendor.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.vendor,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Vendor> = {
            requestId,
            actionName: 'createVendor',
            successMessage: 'Vendor created successfully!',
            errorMessage: 'Failed to create vendor',
            onSuccessAction: (vendor) => vendorActions.createVendorSuccess({ vendor }),
            onErrorAction: (error) => vendorActions.createVendorFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load Vendor by Id effect
  loadVendorById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(vendorActions.loadVendorById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/vendor/${action.id}`;
          const requestId = `${vendorActions.loadVendorById.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            params: action.query as Record<string, unknown>
          };
          const metadata: HttpRequestMetadata<Vendor> = {
            requestId,
            actionName: 'loadVendorById',
            errorMessage: 'Failed to load vendor',
            onSuccessAction: (vendor) => vendorActions.loadVendorByIdSuccess({ vendor }),
            onErrorAction: (error) => vendorActions.loadVendorByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all Vendors effect
  loadVendors: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(vendorActions.loadVendors),
        tap((action) => {
          const { limit, offset, search, sort, includes } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? [{query: '', fields: []}], sort ?? [])
          .applySignalStoreIncludes(includes ?? [])
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/vendor`;
          const requestId = `${vendorActions.loadVendors.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Vendor[]> = {
            requestId,
            actionName: 'loadVendors',
            errorMessage: 'Failed to load vendors',
            onSuccessAction: (vendors) => vendorActions.loadVendorsSuccess({ vendors }),
            onErrorAction: (error) => vendorActions.loadVendorsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count Vendors effect
  countVendors: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(vendorActions.countVendors),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/vendor/count`;
          const requestId = `${vendorActions.countVendors.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countVendors',
            errorMessage: 'Failed to count vendors',
            onSuccessAction: (count) => vendorActions.countVendorsSuccess({ count }),
            onErrorAction: (error) => vendorActions.countVendorsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update Vendor effect
  updateVendor: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(vendorActions.updateVendor),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/vendor/${action.id}`;
          const requestId = `${vendorActions.updateVendor.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.vendor,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Vendor> = {
            requestId,
            actionName: 'updateVendor',
            successMessage: 'Vendor updated successfully!',
            errorMessage: 'Failed to update vendor',
            onSuccessAction: (vendor) => vendorActions.updateVendorSuccess({ vendor }),
            onErrorAction: (error) => vendorActions.updateVendorFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete Vendor effect
  deleteVendor: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(vendorActions.deleteVendor),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/vendor/${action.id}`;
          const requestId = `${vendorActions.deleteVendor.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteVendor',
            successMessage: 'Vendor deleted successfully!',
            errorMessage: 'Failed to delete vendor',
            onSuccessAction: () => vendorActions.deleteVendorSuccess({ id: action.id }),
            onErrorAction: (error) => vendorActions.deleteVendorFailure({ error }),
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
      const store = inject(VendorStore);

      return actions$.pipe(
        ofType(vendorActions.createVendorSuccess),
        tap(({ vendor }) => {
          store.setItems([vendor, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(VendorStore);

      return actions$.pipe(
        ofType(vendorActions.loadVendorByIdSuccess),
        tap(({ vendor }) => {
          store.setSelectedItem(vendor);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadVendorsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(VendorStore);

      return actions$.pipe(
        ofType(vendorActions.loadVendorsSuccess),
        tap(({ vendors }) => {
          store.setItems(vendors);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countVendorsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(VendorStore);

      return actions$.pipe(
        ofType(vendorActions.countVendorsSuccess),
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
      const store = inject(VendorStore);

      return actions$.pipe(
        ofType(vendorActions.updateVendorSuccess),
        tap(({ vendor }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === vendor?.id ? vendor : item
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
      const store = inject(VendorStore);

      return actions$.pipe(
        ofType(vendorActions.deleteVendorSuccess),
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
      const store = inject(VendorStore);

      return actions$.pipe(
        ofType(vendorActions.createVendorFailure),
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
      const store = inject(VendorStore);

      return actions$.pipe(
        ofType(vendorActions.loadVendorByIdFailure),
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
      const store = inject(VendorStore);

      return actions$.pipe(
        ofType(vendorActions.loadVendorsFailure),
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
      const store = inject(VendorStore);

      return actions$.pipe(
        ofType(vendorActions.updateVendorFailure),
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
      const store = inject(VendorStore);

      return actions$.pipe(
        ofType(vendorActions.deleteVendorFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};
