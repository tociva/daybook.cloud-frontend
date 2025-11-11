import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { taxActions } from './tax.actions';
import { Tax } from './tax.model';
import { TaxStore } from './tax.store';

export const taxEffects = {
  // Create Tax effect
  createTax: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(taxActions.createTax),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/tax`;
          const requestId = `${taxActions.createTax.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.tax,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Tax> = {
            requestId,
            actionName: 'createTax',
            successMessage: 'Tax created successfully!',
            errorMessage: 'Failed to create tax',
            onSuccessAction: (tax) => taxActions.createTaxSuccess({ tax }),
            onErrorAction: (error) => taxActions.createTaxFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load Tax by Id effect
  loadTaxById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(taxActions.loadTaxById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/tax/${action.id}`;
          const requestId = `${taxActions.loadTaxById.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Tax> = {
            requestId,
            actionName: 'loadTaxById',
            errorMessage: 'Failed to load tax',
            onSuccessAction: (tax) => taxActions.loadTaxByIdSuccess({ tax }),
            onErrorAction: (error) => taxActions.loadTaxByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all Taxes effect
  loadTaxes: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(taxActions.loadTaxes),
        tap((action) => {
          const { limit, offset, search, sort } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? [{query: '', fields: []}], sort ?? [])
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/tax`;
          const requestId = `${taxActions.loadTaxes.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Tax[]> = {
            requestId,
            actionName: 'loadTaxes',
            errorMessage: 'Failed to load taxes',
            onSuccessAction: (taxes) => taxActions.loadTaxesSuccess({ taxes }),
            onErrorAction: (error) => taxActions.loadTaxesFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count Taxes effect
  countTaxes: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(taxActions.countTaxes),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/tax/count`;
          const requestId = `${taxActions.countTaxes.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countTaxes',
            errorMessage: 'Failed to count taxes',
            onSuccessAction: (count) => taxActions.countTaxesSuccess({ count }),
            onErrorAction: (error) => taxActions.countTaxesFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update Tax effect
  updateTax: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(taxActions.updateTax),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/tax/${action.id}`;
          const requestId = `${taxActions.updateTax.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.tax,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Tax> = {
            requestId,
            actionName: 'updateTax',
            successMessage: 'Tax updated successfully!',
            errorMessage: 'Failed to update tax',
            onSuccessAction: (tax) => taxActions.updateTaxSuccess({ tax }),
            onErrorAction: (error) => taxActions.updateTaxFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete Tax effect
  deleteTax: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(taxActions.deleteTax),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/tax/${action.id}`;
          const requestId = `${taxActions.deleteTax.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteTax',
            successMessage: 'Tax deleted successfully!',
            errorMessage: 'Failed to delete tax',
            onSuccessAction: () => taxActions.deleteTaxSuccess({ id: action.id }),
            onErrorAction: (error) => taxActions.deleteTaxFailure({ error }),
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
      const store = inject(TaxStore);

      return actions$.pipe(
        ofType(taxActions.createTaxSuccess),
        tap(({ tax }) => {
          store.setItems([tax, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(TaxStore);

      return actions$.pipe(
        ofType(taxActions.loadTaxByIdSuccess),
        tap(({ tax }) => {
          store.setSelectedItem(tax);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadTaxesSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(TaxStore);

      return actions$.pipe(
        ofType(taxActions.loadTaxesSuccess),
        tap(({ taxes }) => {
          store.setItems(taxes);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countTaxesSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(TaxStore);

      return actions$.pipe(
        ofType(taxActions.countTaxesSuccess),
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
      const store = inject(TaxStore);

      return actions$.pipe(
        ofType(taxActions.updateTaxSuccess),
        tap(({ tax }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === tax?.id ? tax : item
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
      const store = inject(TaxStore);

      return actions$.pipe(
        ofType(taxActions.deleteTaxSuccess),
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
      const store = inject(TaxStore);

      return actions$.pipe(
        ofType(taxActions.createTaxFailure),
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
      const store = inject(TaxStore);

      return actions$.pipe(
        ofType(taxActions.loadTaxByIdFailure),
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
      const store = inject(TaxStore);

      return actions$.pipe(
        ofType(taxActions.loadTaxesFailure),
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
      const store = inject(TaxStore);

      return actions$.pipe(
        ofType(taxActions.updateTaxFailure),
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
      const store = inject(TaxStore);

      return actions$.pipe(
        ofType(taxActions.deleteTaxFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Bulk upload Taxes effect
  uploadBulkTaxes: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(taxActions.uploadBulkTaxes),
        tap(({ file }) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/tax/bulk-upload`; 
          // ⬆️ adjust path to match your backend

          const requestId = `${taxActions.uploadBulkTaxes.type}-${Date.now()}-${Math.random()}`;

          const formData = new FormData();
          formData.append('file', file);

          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: formData,
            // Do NOT set Content-Type; browser will set multipart boundary
          };

          const metadata: HttpRequestMetadata<Tax[]> = {
            requestId,
            actionName: 'uploadBulkTaxes',
            successMessage: 'Taxes uploaded successfully!',
            errorMessage: 'Failed to upload taxes',
            onSuccessAction: (taxes) =>
              taxActions.uploadBulkTaxesSuccess({ taxes }),
            onErrorAction: (error) =>
              taxActions.uploadBulkTaxesFailure({ error }),
          };

          store.dispatch(
            httpActions.executeRequest({
              config,
              metadata: metadata as HttpRequestMetadata<unknown>,
            })
          );
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Bulk upload success
  uploadBulkTaxesSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(TaxStore);

      return actions$.pipe(
        ofType(taxActions.uploadBulkTaxesSuccess),
        tap(({ taxes }) => {
          const current = store.items();
          // prepend newly uploaded or merge as per your preference
          store.setItems([...taxes, ...current]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Bulk upload failure
  uploadBulkTaxesFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(TaxStore);

      return actions$.pipe(
        ofType(taxActions.uploadBulkTaxesFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};
