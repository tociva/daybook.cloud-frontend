import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { bankTxnActions } from './bank-txn.actions';
import { BankTxn } from './bank-txn.model';
import { BankTxnStore } from './bank-txn.store';

export const bankTxnEffects = {
  // Create BankTxn effect
  createBankTxn: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankTxnActions.createBankTxn),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/bank-txn`;
          const requestId = `${bankTxnActions.createBankTxn.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.bankTxn,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<BankTxn> = {
            requestId,
            actionName: 'createBankTxn',
            successMessage: 'Bank transaction created successfully!',
            errorMessage: 'Failed to create bank transaction',
            onSuccessAction: (bankTxn) => bankTxnActions.createBankTxnSuccess({ bankTxn }),
            onErrorAction: (error) => bankTxnActions.createBankTxnFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load BankTxn by Id effect
  loadBankTxnById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankTxnActions.loadBankTxnById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/bank-txn/${action.id}`;
          const requestId = `${bankTxnActions.loadBankTxnById.type}-${Date.now()}-${Math.random()}`;
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
          const metadata: HttpRequestMetadata<BankTxn> = {
            requestId,
            actionName: 'loadBankTxnById',
            errorMessage: 'Failed to load bank transaction',
            onSuccessAction: (bankTxn) => bankTxnActions.loadBankTxnByIdSuccess({ bankTxn }),
            onErrorAction: (error) => bankTxnActions.loadBankTxnByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all BankTxns effect
  loadBankTxns: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankTxnActions.loadBankTxns),
        tap((action) => {
          const { limit, offset, search, sort, includes } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? [{query: '', fields: []}], sort ?? [], includes)
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/bank-txn`;
          const requestId = `${bankTxnActions.loadBankTxns.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<BankTxn[]> = {
            requestId,
            actionName: 'loadBankTxns',
            errorMessage: 'Failed to load bank transactions',
            onSuccessAction: (bankTxns) => bankTxnActions.loadBankTxnsSuccess({ bankTxns }),
            onErrorAction: (error) => bankTxnActions.loadBankTxnsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count BankTxns effect
  countBankTxns: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankTxnActions.countBankTxns),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/bank-txn/count`;
          const requestId = `${bankTxnActions.countBankTxns.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countBankTxns',
            errorMessage: 'Failed to count bank transactions',
            onSuccessAction: (count) => bankTxnActions.countBankTxnsSuccess({ count }),
            onErrorAction: (error) => bankTxnActions.countBankTxnsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update BankTxn effect
  updateBankTxn: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankTxnActions.updateBankTxn),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/bank-txn/${action.id}`;
          const requestId = `${bankTxnActions.updateBankTxn.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.bankTxn,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<BankTxn> = {
            requestId,
            actionName: 'updateBankTxn',
            successMessage: 'Bank transaction updated successfully!',
            errorMessage: 'Failed to update bank transaction',
            onSuccessAction: (bankTxn) => bankTxnActions.updateBankTxnSuccess({ bankTxn }),
            onErrorAction: (error) => bankTxnActions.updateBankTxnFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete BankTxn effect
  deleteBankTxn: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankTxnActions.deleteBankTxn),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/bank-txn/${action.id}`;
          const requestId = `${bankTxnActions.deleteBankTxn.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteBankTxn',
            successMessage: 'Bank transaction deleted successfully!',
            errorMessage: 'Failed to delete bank transaction',
            onSuccessAction: () => bankTxnActions.deleteBankTxnSuccess({ id: action.id }),
            onErrorAction: (error) => bankTxnActions.deleteBankTxnFailure({ error }),
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
      const store = inject(BankTxnStore);

      return actions$.pipe(
        ofType(bankTxnActions.createBankTxnSuccess),
        tap(({ bankTxn }) => {
          store.setItems([bankTxn, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(BankTxnStore);

      return actions$.pipe(
        ofType(bankTxnActions.loadBankTxnByIdSuccess),
        tap(({ bankTxn }) => {
          store.setSelectedItem(bankTxn);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadBankTxnsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(BankTxnStore);

      return actions$.pipe(
        ofType(bankTxnActions.loadBankTxnsSuccess),
        tap(({ bankTxns }) => {
          store.setItems(bankTxns);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countBankTxnsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(BankTxnStore);

      return actions$.pipe(
        ofType(bankTxnActions.countBankTxnsSuccess),
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
      const store = inject(BankTxnStore);

      return actions$.pipe(
        ofType(bankTxnActions.updateBankTxnSuccess),
        tap(({ bankTxn }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === bankTxn?.id ? bankTxn : item
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
      const store = inject(BankTxnStore);

      return actions$.pipe(
        ofType(bankTxnActions.deleteBankTxnSuccess),
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
      const store = inject(BankTxnStore);

      return actions$.pipe(
        ofType(bankTxnActions.createBankTxnFailure),
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
      const store = inject(BankTxnStore);

      return actions$.pipe(
        ofType(bankTxnActions.loadBankTxnByIdFailure),
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
      const store = inject(BankTxnStore);

      return actions$.pipe(
        ofType(bankTxnActions.loadBankTxnsFailure),
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
      const store = inject(BankTxnStore);

      return actions$.pipe(
        ofType(bankTxnActions.updateBankTxnFailure),
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
      const store = inject(BankTxnStore);

      return actions$.pipe(
        ofType(bankTxnActions.deleteBankTxnFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Bulk upload BankTxns effect
  uploadBulkBankTxns: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankTxnActions.uploadBulkBankTxns),
        tap(({ file }) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/bank-txn/bulk-upload`; 

          const requestId = `${bankTxnActions.uploadBulkBankTxns.type}-${Date.now()}-${Math.random()}`;

          const formData = new FormData();
          formData.append('file', file);

          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: formData,
            // Do NOT set Content-Type; browser will set multipart boundary
          };

          const metadata: HttpRequestMetadata<BankTxn[]> = {
            requestId,
            actionName: 'uploadBulkBankTxns',
            successMessage: 'Bank transactions uploaded successfully!',
            errorMessage: 'Failed to upload bank transactions',
            onSuccessAction: (bankTxns) =>
              bankTxnActions.uploadBulkBankTxnsSuccess({ bankTxns }),
            onErrorAction: (error) =>
              bankTxnActions.uploadBulkBankTxnsFailure({ error }),
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
  uploadBulkBankTxnsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(BankTxnStore);

      return actions$.pipe(
        ofType(bankTxnActions.uploadBulkBankTxnsSuccess),
        tap(({ bankTxns }) => {
          const current = store.items();
          // prepend newly uploaded or merge as per your preference
          store.setItems([...bankTxns, ...current]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Bulk upload failure
  uploadBulkBankTxnsFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(BankTxnStore);

      return actions$.pipe(
        ofType(bankTxnActions.uploadBulkBankTxnsFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};


