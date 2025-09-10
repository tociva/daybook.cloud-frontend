import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { fiscalYearActions } from './fiscal-year.actions';
import { FiscalYear } from './fiscal-year.model';
import { FiscalYearStore } from './fiscal-year.store';

export const fiscalYearEffects = {
  // Create Fiscal Year effect
  createFiscalYear: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(fiscalYearActions.createFiscalYear),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/fiscal-year`;
          const requestId = `${fiscalYearActions.createFiscalYear.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.fiscalYear,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<FiscalYear> = {
            requestId,
            actionName: 'createFiscalYear',
            successMessage: 'Fiscal year created successfully!',
            errorMessage: 'Failed to create fiscal year',
            onSuccessAction: (fiscalYear) => fiscalYearActions.createFiscalYearSuccess({ fiscalYear }),
            onErrorAction: (error) => fiscalYearActions.createFiscalYearFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load Fiscal Year by Id effect
  loadFiscalYearById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(fiscalYearActions.loadFiscalYearById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/fiscal-year/${action.id}`;
          const requestId = `${fiscalYearActions.loadFiscalYearById.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<FiscalYear> = {
            requestId,
            actionName: 'loadFiscalYearById',
            errorMessage: 'Failed to load fiscal year',
            onSuccessAction: (fiscalYear) => fiscalYearActions.loadFiscalYearByIdSuccess({ fiscalYear }),
            onErrorAction: (error) => fiscalYearActions.loadFiscalYearByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all Fiscal Years effect
  loadFiscalYears: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(fiscalYearActions.loadFiscalYears),
        tap((action) => {
          const { limit, offset, search, sort } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? {query: '', fields: []}, sort ?? [])
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/fiscal-year`;
          const requestId = `${fiscalYearActions.loadFiscalYears.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<FiscalYear[]> = {
            requestId,
            actionName: 'loadFiscalYears',
            errorMessage: 'Failed to load fiscal years',
            onSuccessAction: (fiscalYears) => fiscalYearActions.loadFiscalYearsSuccess({ fiscalYears }),
            onErrorAction: (error) => fiscalYearActions.loadFiscalYearsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count Fiscal Years effect
  countFiscalYears: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(fiscalYearActions.countFiscalYears),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/fiscal-year/count`;
          const requestId = `${fiscalYearActions.countFiscalYears.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countFiscalYears',
            errorMessage: 'Failed to count fiscal years',
            onSuccessAction: (count) => fiscalYearActions.countFiscalYearsSuccess({ count }),
            onErrorAction: (error) => fiscalYearActions.countFiscalYearsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update Fiscal Year effect
  updateFiscalYear: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(fiscalYearActions.updateFiscalYear),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/fiscal-year/${action.id}`;
          const requestId = `${fiscalYearActions.updateFiscalYear.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.fiscalYear,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<FiscalYear> = {
            requestId,
            actionName: 'updateFiscalYear',
            successMessage: 'Fiscal year updated successfully!',
            errorMessage: 'Failed to update fiscal year',
            onSuccessAction: (fiscalYear) => fiscalYearActions.updateFiscalYearSuccess({ fiscalYear }),
            onErrorAction: (error) => fiscalYearActions.updateFiscalYearFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete Fiscal Year effect
  deleteFiscalYear: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(fiscalYearActions.deleteFiscalYear),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/fiscal-year/${action.id}`;
          const requestId = `${fiscalYearActions.deleteFiscalYear.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteFiscalYear',
            successMessage: 'Fiscal year deleted successfully!',
            errorMessage: 'Failed to delete fiscal year',
            onSuccessAction: () => fiscalYearActions.deleteFiscalYearSuccess({ id: action.id }),
            onErrorAction: (error) => fiscalYearActions.deleteFiscalYearFailure({ error }),
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
      const store = inject(FiscalYearStore);

      return actions$.pipe(
        ofType(fiscalYearActions.createFiscalYearSuccess),
        tap(({ fiscalYear }) => {
          store.setItems([fiscalYear, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(FiscalYearStore);

      return actions$.pipe(
        ofType(fiscalYearActions.loadFiscalYearByIdSuccess),
        tap(({ fiscalYear }) => {
          store.setSelectedItem(fiscalYear);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadFiscalYearsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(FiscalYearStore);

      return actions$.pipe(
        ofType(fiscalYearActions.loadFiscalYearsSuccess),
        tap(({ fiscalYears }) => {
          store.setItems(fiscalYears);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countFiscalYearsSuccess: createEffect(

    () => {
      const actions$ = inject(Actions);
      const store = inject(FiscalYearStore);

      return actions$.pipe(
        ofType(fiscalYearActions.countFiscalYearsSuccess),
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
      const store = inject(FiscalYearStore);

      return actions$.pipe(
        ofType(fiscalYearActions.updateFiscalYearSuccess),
        tap(({ fiscalYear }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === fiscalYear?.id ? fiscalYear : item
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
      const store = inject(FiscalYearStore);

      return actions$.pipe(
        ofType(fiscalYearActions.deleteFiscalYearSuccess),
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
      const store = inject(FiscalYearStore);

      return actions$.pipe(
        ofType(fiscalYearActions.createFiscalYearFailure),
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
      const store = inject(FiscalYearStore);

      return actions$.pipe(
        ofType(fiscalYearActions.loadFiscalYearByIdFailure),
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
      const store = inject(FiscalYearStore);

      return actions$.pipe(
        ofType(fiscalYearActions.loadFiscalYearsFailure),
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
      const store = inject(FiscalYearStore);

      return actions$.pipe(
        ofType(fiscalYearActions.updateFiscalYearFailure),
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
      const store = inject(FiscalYearStore);

      return actions$.pipe(
        ofType(fiscalYearActions.deleteFiscalYearFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};