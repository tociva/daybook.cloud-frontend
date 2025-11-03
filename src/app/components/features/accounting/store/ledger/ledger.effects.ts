import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { ledgerActions } from './ledger.actions';
import { Ledger } from './ledger.model';
import { LedgerStore } from './ledger.store';

export const ledgerEffects = {
  // Create Ledger effect
  createLedger: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(ledgerActions.createLedger),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/ledger`;
          const requestId = `${ledgerActions.createLedger.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.ledger,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Ledger> = {
            requestId,
            actionName: 'createLedger',
            successMessage: 'Ledger created successfully!',
            errorMessage: 'Failed to create ledger',
            onSuccessAction: (ledger) => ledgerActions.createLedgerSuccess({ ledger }),
            onErrorAction: (error) => ledgerActions.createLedgerFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load Ledger by Id effect
  loadLedgerById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(ledgerActions.loadLedgerById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/ledger/${action.id}`;
          const requestId = `${ledgerActions.loadLedgerById.type}-${Date.now()}-${Math.random()}`;
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
          const metadata: HttpRequestMetadata<Ledger> = {
            requestId,
            actionName: 'loadLedgerById',
            errorMessage: 'Failed to load ledger',
            onSuccessAction: (ledger) => ledgerActions.loadLedgerByIdSuccess({ ledger }),
            onErrorAction: (error) => ledgerActions.loadLedgerByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all Ledgers effect
  loadLedgers: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(ledgerActions.loadLedgers),
        tap((action) => {
          const { limit, offset, search, sort, includes } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? [{query: '', fields: []}], sort ?? [], includes)
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/ledger`;
          const requestId = `${ledgerActions.loadLedgers.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Ledger[]> = {
            requestId,
            actionName: 'loadLedgers',
            errorMessage: 'Failed to load ledgers',
            onSuccessAction: (ledgers) => ledgerActions.loadLedgersSuccess({ ledgers }),
            onErrorAction: (error) => ledgerActions.loadLedgersFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count Ledgers effect
  countLedgers: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(ledgerActions.countLedgers),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/ledger/count`;
          const requestId = `${ledgerActions.countLedgers.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countLedgers',
            errorMessage: 'Failed to count ledgers',
            onSuccessAction: (count) => ledgerActions.countLedgersSuccess({ count }),
            onErrorAction: (error) => ledgerActions.countLedgersFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update Ledger effect
  updateLedger: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(ledgerActions.updateLedger),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/ledger/${action.id}`;
          const requestId = `${ledgerActions.updateLedger.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.ledger,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Ledger> = {
            requestId,
            actionName: 'updateLedger',
            successMessage: 'Ledger updated successfully!',
            errorMessage: 'Failed to update ledger',
            onSuccessAction: (ledger) => ledgerActions.updateLedgerSuccess({ ledger }),
            onErrorAction: (error) => ledgerActions.updateLedgerFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete Ledger effect
  deleteLedger: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(ledgerActions.deleteLedger),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/ledger/${action.id}`;
          const requestId = `${ledgerActions.deleteLedger.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteLedger',
            successMessage: 'Ledger deleted successfully!',
            errorMessage: 'Failed to delete ledger',
            onSuccessAction: () => ledgerActions.deleteLedgerSuccess({ id: action.id }),
            onErrorAction: (error) => ledgerActions.deleteLedgerFailure({ error }),
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
      const store = inject(LedgerStore);

      return actions$.pipe(
        ofType(ledgerActions.createLedgerSuccess),
        tap(({ ledger }) => {
          store.setItems([ledger, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(LedgerStore);

      return actions$.pipe(
        ofType(ledgerActions.loadLedgerByIdSuccess),
        tap(({ ledger }) => {
          store.setSelectedItem(ledger);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadLedgersSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(LedgerStore);

      return actions$.pipe(
        ofType(ledgerActions.loadLedgersSuccess),
        tap(({ ledgers }) => {
          store.setItems(ledgers);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countLedgersSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(LedgerStore);

      return actions$.pipe(
        ofType(ledgerActions.countLedgersSuccess),
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
      const store = inject(LedgerStore);

      return actions$.pipe(
        ofType(ledgerActions.updateLedgerSuccess),
        tap(({ ledger }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === ledger?.id ? ledger : item
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
      const store = inject(LedgerStore);

      return actions$.pipe(
        ofType(ledgerActions.deleteLedgerSuccess),
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
      const store = inject(LedgerStore);

      return actions$.pipe(
        ofType(ledgerActions.createLedgerFailure),
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
      const store = inject(LedgerStore);

      return actions$.pipe(
        ofType(ledgerActions.loadLedgerByIdFailure),
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
      const store = inject(LedgerStore);

      return actions$.pipe(
        ofType(ledgerActions.loadLedgersFailure),
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
      const store = inject(LedgerStore);

      return actions$.pipe(
        ofType(ledgerActions.updateLedgerFailure),
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
      const store = inject(LedgerStore);

      return actions$.pipe(
        ofType(ledgerActions.deleteLedgerFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};
