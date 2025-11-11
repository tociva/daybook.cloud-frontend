import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { bankCashActions } from './bank-cash.actions';
import { BankCash } from './bank-cash.model';
import { BankCashStore } from './bank-cash.store';

export const bankCashEffects = {
  // Create BankCash effect
  createBankCash: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankCashActions.createBankCash),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/bank-cash`;
          const requestId = `${bankCashActions.createBankCash.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.bankCash,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<BankCash> = {
            requestId,
            actionName: 'createBankCash',
            successMessage: 'Bank cash created successfully!',
            errorMessage: 'Failed to create bank cash',
            onSuccessAction: (bankCash) => bankCashActions.createBankCashSuccess({ bankCash }),
            onErrorAction: (error) => bankCashActions.createBankCashFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load BankCash by Id effect
  loadBankCashById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankCashActions.loadBankCashById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/bank-cash/${action.id}`;
          const requestId = `${bankCashActions.loadBankCashById.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<BankCash> = {
            requestId,
            actionName: 'loadBankCashById',
            errorMessage: 'Failed to load bank cash',
            onSuccessAction: (bankCash) => bankCashActions.loadBankCashByIdSuccess({ bankCash }),
            onErrorAction: (error) => bankCashActions.loadBankCashByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all BankCashes effect
  loadBankCashes: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankCashActions.loadBankCashes),
        tap((action) => {
          const { limit, offset, search, sort } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? [{query: '', fields: []}], sort ?? [])
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/bank-cash`;
          const requestId = `${bankCashActions.loadBankCashes.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<BankCash[]> = {
            requestId,
            actionName: 'loadBankCashes',
            errorMessage: 'Failed to load bank cashes',
            onSuccessAction: (bankCashes) => bankCashActions.loadBankCashesSuccess({ bankCashes }),
            onErrorAction: (error) => bankCashActions.loadBankCashesFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count BankCashes effect
  countBankCashes: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankCashActions.countBankCashes),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/bank-cash/count`;
          const requestId = `${bankCashActions.countBankCashes.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countBankCashes',
            errorMessage: 'Failed to count bank cashes',
            onSuccessAction: (count) => bankCashActions.countBankCashesSuccess({ count }),
            onErrorAction: (error) => bankCashActions.countBankCashesFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update BankCash effect
  updateBankCash: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankCashActions.updateBankCash),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/bank-cash/${action.id}`;
          const requestId = `${bankCashActions.updateBankCash.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.bankCash,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<BankCash> = {
            requestId,
            actionName: 'updateBankCash',
            successMessage: 'Bank cash updated successfully!',
            errorMessage: 'Failed to update bank cash',
            onSuccessAction: (bankCash) => bankCashActions.updateBankCashSuccess({ bankCash }),
            onErrorAction: (error) => bankCashActions.updateBankCashFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete BankCash effect
  deleteBankCash: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(bankCashActions.deleteBankCash),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/bank-cash/${action.id}`;
          const requestId = `${bankCashActions.deleteBankCash.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteBankCash',
            successMessage: 'Bank cash deleted successfully!',
            errorMessage: 'Failed to delete bank cash',
            onSuccessAction: () => bankCashActions.deleteBankCashSuccess({ id: action.id }),
            onErrorAction: (error) => bankCashActions.deleteBankCashFailure({ error }),
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
      const store = inject(BankCashStore);

      return actions$.pipe(
        ofType(bankCashActions.createBankCashSuccess),
        tap(({ bankCash }) => {
          store.setItems([bankCash, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(BankCashStore);

      return actions$.pipe(
        ofType(bankCashActions.loadBankCashByIdSuccess),
        tap(({ bankCash }) => {
          store.setSelectedItem(bankCash);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadBankCashesSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(BankCashStore);

      return actions$.pipe(
        ofType(bankCashActions.loadBankCashesSuccess),
        tap(({ bankCashes }) => {
          store.setItems(bankCashes);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countBankCashesSuccess: createEffect(

    () => {
      const actions$ = inject(Actions);
      const store = inject(BankCashStore);

      return actions$.pipe(
        ofType(bankCashActions.countBankCashesSuccess),
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
      const store = inject(BankCashStore);

      return actions$.pipe(
        ofType(bankCashActions.updateBankCashSuccess),
        tap(({ bankCash }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === bankCash?.id ? bankCash : item
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
      const store = inject(BankCashStore);

      return actions$.pipe(
        ofType(bankCashActions.deleteBankCashSuccess),
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
      const store = inject(BankCashStore);

      return actions$.pipe(
        ofType(bankCashActions.createBankCashFailure),
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
      const store = inject(BankCashStore);

      return actions$.pipe(
        ofType(bankCashActions.loadBankCashByIdFailure),
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
      const store = inject(BankCashStore);

      return actions$.pipe(
        ofType(bankCashActions.loadBankCashesFailure),
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
      const store = inject(BankCashStore);

      return actions$.pipe(
        ofType(bankCashActions.updateBankCashFailure),
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
      const store = inject(BankCashStore);

      return actions$.pipe(
        ofType(bankCashActions.deleteBankCashFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  ),
  // Bulk upload BankCashes effect
uploadBulkBankCashes: createEffect(
  () => {
    const actions$ = inject(Actions);
    const configStore = inject(ConfigStore);
    const store = inject(Store);

    return actions$.pipe(
      ofType(bankCashActions.uploadBulkBankCashes),
      tap(({ file }) => {
        const baseUrl = `${configStore.config().apiBaseUrl}/inventory/bank-cash/bulk-upload`; 
        // ⬆️ adjust path to match your backend

        const requestId = `${bankCashActions.uploadBulkBankCashes.type}-${Date.now()}-${Math.random()}`;

        const formData = new FormData();
        formData.append('file', file);

        const config: HttpRequestConfig = {
          url: baseUrl,
          method: 'POST',
          body: formData,
          // Do NOT set Content-Type; browser will set multipart boundary
        };

        const metadata: HttpRequestMetadata<BankCash[]> = {
          requestId,
          actionName: 'uploadBulkBankCashes',
          successMessage: 'Bank cashes uploaded successfully!',
          errorMessage: 'Failed to upload bank cashes',
          onSuccessAction: (bankCashes) =>
            bankCashActions.uploadBulkBankCashesSuccess({ bankCashes }),
          onErrorAction: (error) =>
            bankCashActions.uploadBulkBankCashesFailure({ error }),
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
uploadBulkBankCashesSuccess: createEffect(
  () => {
    const actions$ = inject(Actions);
    const store = inject(BankCashStore);

    return actions$.pipe(
      ofType(bankCashActions.uploadBulkBankCashesSuccess),
      tap(({ bankCashes }) => {
        const current = store.items();
        // prepend newly uploaded or merge as per your preference
        store.setItems([...bankCashes, ...current]);
      })
    );
  },
  { functional: true, dispatch: false }
),

// Bulk upload failure
uploadBulkBankCashesFailure: createEffect(
  () => {
    const actions$ = inject(Actions);
    const store = inject(BankCashStore);

    return actions$.pipe(
      ofType(bankCashActions.uploadBulkBankCashesFailure),
      tap(({ error }) => {
        store.setError(error);
      })
    );
  },
  { functional: true, dispatch: false }
),

};
