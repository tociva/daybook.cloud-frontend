import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { bankLedgerMapActions } from './bank-ledger-map.actions';
import { BankCashLedgerMap } from './bank-ledger-map.model';
import { BankLedgerMapStore } from './bank-ledger-map.store';

export const bankLedgerMapEffects = {
  // Create BankLedgerMap effect
  createBankLedgerMap: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankLedgerMapActions.createBankLedgerMap),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/bank-cash-ledger-map`;
          const requestId = `${bankLedgerMapActions.createBankLedgerMap.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.bankLedgerMap,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<BankCashLedgerMap> = {
            requestId,
            actionName: 'createBankLedgerMap',
            successMessage: 'Bank ledger map created successfully!',
            errorMessage: 'Failed to create bank ledger map',
            onSuccessAction: (bankLedgerMap) => bankLedgerMapActions.createBankLedgerMapSuccess({ bankLedgerMap }),
            onErrorAction: (error) => bankLedgerMapActions.createBankLedgerMapFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load BankLedgerMap by Id effect
  loadBankLedgerMapById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankLedgerMapActions.loadBankLedgerMapById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/bank-cash-ledger-map/${action.id}`;
          const requestId = `${bankLedgerMapActions.loadBankLedgerMapById.type}-${Date.now()}-${Math.random()}`;
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
          const metadata: HttpRequestMetadata<BankCashLedgerMap> = {
            requestId,
            actionName: 'loadBankLedgerMapById',
            errorMessage: 'Failed to load bank ledger map',
            onSuccessAction: (bankLedgerMap) => bankLedgerMapActions.loadBankLedgerMapByIdSuccess({ bankLedgerMap }),
            onErrorAction: (error) => bankLedgerMapActions.loadBankLedgerMapByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all BankLedgerMaps effect
  loadBankLedgerMaps: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankLedgerMapActions.loadBankLedgerMaps),
        tap((action) => {
          const { limit, offset, search, sort, includes } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? [{query: '', fields: []}], sort ?? [], includes)
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/bank-cash-ledger-map`;
          const requestId = `${bankLedgerMapActions.loadBankLedgerMaps.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<BankCashLedgerMap[]> = {
            requestId,
            actionName: 'loadBankLedgerMaps',
            errorMessage: 'Failed to load bank ledger maps',
            onSuccessAction: (bankLedgerMaps) => bankLedgerMapActions.loadBankLedgerMapsSuccess({ bankLedgerMaps }),
            onErrorAction: (error) => bankLedgerMapActions.loadBankLedgerMapsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count BankLedgerMaps effect
  countBankLedgerMaps: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankLedgerMapActions.countBankLedgerMaps),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/bank-cash-ledger-map/count`;
          const requestId = `${bankLedgerMapActions.countBankLedgerMaps.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countBankLedgerMaps',
            errorMessage: 'Failed to count bank ledger maps',
            onSuccessAction: (count) => bankLedgerMapActions.countBankLedgerMapsSuccess({ count }),
            onErrorAction: (error) => bankLedgerMapActions.countBankLedgerMapsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update BankLedgerMap effect
  updateBankLedgerMap: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankLedgerMapActions.updateBankLedgerMap),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/bank-cash-ledger-map/${action.id}`;
          const requestId = `${bankLedgerMapActions.updateBankLedgerMap.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.bankLedgerMap,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<BankCashLedgerMap> = {
            requestId,
            actionName: 'updateBankLedgerMap',
            successMessage: 'Bank ledger map updated successfully!',
            errorMessage: 'Failed to update bank ledger map',
            onSuccessAction: (bankLedgerMap) => bankLedgerMapActions.updateBankLedgerMapSuccess({ bankLedgerMap }),
            onErrorAction: (error) => bankLedgerMapActions.updateBankLedgerMapFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete BankLedgerMap effect
  deleteBankLedgerMap: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankLedgerMapActions.deleteBankLedgerMap),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/bank-cash-ledger-map/${action.id}`;
          const requestId = `${bankLedgerMapActions.deleteBankLedgerMap.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteBankLedgerMap',
            successMessage: 'Bank ledger map deleted successfully!',
            errorMessage: 'Failed to delete bank ledger map',
            onSuccessAction: () => bankLedgerMapActions.deleteBankLedgerMapSuccess({ id: action.id }),
            onErrorAction: (error) => bankLedgerMapActions.deleteBankLedgerMapFailure({ error }),
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
      const store = inject(BankLedgerMapStore);

      return actions$.pipe(
        ofType(bankLedgerMapActions.createBankLedgerMapSuccess),
        tap(({ bankLedgerMap }) => {
          store.setItems([bankLedgerMap, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(BankLedgerMapStore);

      return actions$.pipe(
        ofType(bankLedgerMapActions.loadBankLedgerMapByIdSuccess),
        tap(({ bankLedgerMap }) => {
          store.setSelectedItem(bankLedgerMap);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadBankLedgerMapsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(BankLedgerMapStore);

      return actions$.pipe(
        ofType(bankLedgerMapActions.loadBankLedgerMapsSuccess),
        tap(({ bankLedgerMaps }) => {
          store.setItems(bankLedgerMaps);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countBankLedgerMapsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(BankLedgerMapStore);

      return actions$.pipe(
        ofType(bankLedgerMapActions.countBankLedgerMapsSuccess),
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
      const store = inject(BankLedgerMapStore);

      return actions$.pipe(
        ofType(bankLedgerMapActions.updateBankLedgerMapSuccess),
        tap(({ bankLedgerMap }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === bankLedgerMap?.id ? bankLedgerMap : item
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
      const store = inject(BankLedgerMapStore);

      return actions$.pipe(
        ofType(bankLedgerMapActions.deleteBankLedgerMapSuccess),
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
      const store = inject(BankLedgerMapStore);

      return actions$.pipe(
        ofType(bankLedgerMapActions.createBankLedgerMapFailure),
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
      const store = inject(BankLedgerMapStore);

      return actions$.pipe(
        ofType(bankLedgerMapActions.loadBankLedgerMapByIdFailure),
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
      const store = inject(BankLedgerMapStore);

      return actions$.pipe(
        ofType(bankLedgerMapActions.loadBankLedgerMapsFailure),
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
      const store = inject(BankLedgerMapStore);

      return actions$.pipe(
        ofType(bankLedgerMapActions.updateBankLedgerMapFailure),
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
      const store = inject(BankLedgerMapStore);

      return actions$.pipe(
        ofType(bankLedgerMapActions.deleteBankLedgerMapFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Bulk upload BankLedgerMaps effect
  uploadBulkBankLedgerMaps: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankLedgerMapActions.uploadBulkBankLedgerMaps),
        tap(({ file }) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/bank-cash-ledger-map/bulk-upload`; 

          const requestId = `${bankLedgerMapActions.uploadBulkBankLedgerMaps.type}-${Date.now()}-${Math.random()}`;

          const formData = new FormData();
          formData.append('file', file);

          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: formData,
            // Do NOT set Content-Type; browser will set multipart boundary
          };

          const metadata: HttpRequestMetadata<BankCashLedgerMap[]> = {
            requestId,
            actionName: 'uploadBulkBankLedgerMaps',
            successMessage: 'Bank ledger maps uploaded successfully!',
            errorMessage: 'Failed to upload bank ledger maps',
            onSuccessAction: (bankLedgerMaps) =>
              bankLedgerMapActions.uploadBulkBankLedgerMapsSuccess({ bankLedgerMaps }),
            onErrorAction: (error) =>
              bankLedgerMapActions.uploadBulkBankLedgerMapsFailure({ error }),
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
  uploadBulkBankLedgerMapsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(BankLedgerMapStore);

      return actions$.pipe(
        ofType(bankLedgerMapActions.uploadBulkBankLedgerMapsSuccess),
        tap(({ bankLedgerMaps }) => {
          const current = store.items();
          // prepend newly uploaded or merge as per your preference
          store.setItems([...bankLedgerMaps, ...current]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Bulk upload failure
  uploadBulkBankLedgerMapsFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(BankLedgerMapStore);

      return actions$.pipe(
        ofType(bankLedgerMapActions.uploadBulkBankLedgerMapsFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};

