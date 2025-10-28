import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { customerReceiptActions } from './customer-receipt.actions';
import { CustomerReceipt } from './customer-receipt.model';
import { CustomerReceiptStore } from './customer-receipt.store';

export const customerReceiptEffects = {
  // Create CustomerReceipt effect
  createCustomerReceipt: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(customerReceiptActions.createCustomerReceipt),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/customer-receipt`;
          const requestId = `${customerReceiptActions.createCustomerReceipt.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.customerReceipt,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<CustomerReceipt> = {
            requestId,
            actionName: 'createCustomerReceipt',
            successMessage: 'Customer receipt created successfully!',
            errorMessage: 'Failed to create customer receipt',
            onSuccessAction: (customerReceipt) => customerReceiptActions.createCustomerReceiptSuccess({ customerReceipt }),
            onErrorAction: (error) => customerReceiptActions.createCustomerReceiptFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load CustomerReceipt by Id effect
  loadCustomerReceiptById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(customerReceiptActions.loadCustomerReceiptById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/customer-receipt/${action.id}`;
          const requestId = `${customerReceiptActions.loadCustomerReceiptById.type}-${Date.now()}-${Math.random()}`;
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
          const metadata: HttpRequestMetadata<CustomerReceipt> = {
            requestId,
            actionName: 'loadCustomerReceiptById',
            errorMessage: 'Failed to load customer receipt',
            onSuccessAction: (customerReceipt) => customerReceiptActions.loadCustomerReceiptByIdSuccess({ customerReceipt }),
            onErrorAction: (error) => customerReceiptActions.loadCustomerReceiptByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all CustomerReceipts effect
  loadCustomerReceipts: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(customerReceiptActions.loadCustomerReceipts),
        tap((action) => {
          const { limit, offset, search, sort, includes } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? {query: '', fields: []}, sort ?? [], includes)
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/customer-receipt`;
          const requestId = `${customerReceiptActions.loadCustomerReceipts.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<CustomerReceipt[]> = {
            requestId,
            actionName: 'loadCustomerReceipts',
            errorMessage: 'Failed to load customer receipts',
            onSuccessAction: (customerReceipts) => customerReceiptActions.loadCustomerReceiptsSuccess({ customerReceipts }),
            onErrorAction: (error) => customerReceiptActions.loadCustomerReceiptsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count CustomerReceipts effect
  countCustomerReceipts: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(customerReceiptActions.countCustomerReceipts),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/customer-receipt/count`;
          const requestId = `${customerReceiptActions.countCustomerReceipts.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countCustomerReceipts',
            errorMessage: 'Failed to count customer receipts',
            onSuccessAction: (count) => customerReceiptActions.countCustomerReceiptsSuccess({ count }),
            onErrorAction: (error) => customerReceiptActions.countCustomerReceiptsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update CustomerReceipt effect
  updateCustomerReceipt: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(customerReceiptActions.updateCustomerReceipt),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/customer-receipt/${action.id}`;
          const requestId = `${customerReceiptActions.updateCustomerReceipt.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.customerReceipt,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<CustomerReceipt> = {
            requestId,
            actionName: 'updateCustomerReceipt',
            successMessage: 'Customer receipt updated successfully!',
            errorMessage: 'Failed to update customer receipt',
            onSuccessAction: (customerReceipt) => customerReceiptActions.updateCustomerReceiptSuccess({ customerReceipt }),
            onErrorAction: (error) => customerReceiptActions.updateCustomerReceiptFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete CustomerReceipt effect
  deleteCustomerReceipt: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(customerReceiptActions.deleteCustomerReceipt),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/customer-receipt/${action.id}`;
          const requestId = `${customerReceiptActions.deleteCustomerReceipt.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteCustomerReceipt',
            successMessage: 'Customer receipt deleted successfully!',
            errorMessage: 'Failed to delete customer receipt',
            onSuccessAction: () => customerReceiptActions.deleteCustomerReceiptSuccess({ id: action.id }),
            onErrorAction: (error) => customerReceiptActions.deleteCustomerReceiptFailure({ error }),
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
      const store = inject(CustomerReceiptStore);

      return actions$.pipe(
        ofType(customerReceiptActions.createCustomerReceiptSuccess),
        tap(({ customerReceipt }) => {
          store.setItems([customerReceipt, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(CustomerReceiptStore);

      return actions$.pipe(
        ofType(customerReceiptActions.loadCustomerReceiptByIdSuccess),
        tap(({ customerReceipt }) => {
          store.setSelectedItem(customerReceipt);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadCustomerReceiptsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(CustomerReceiptStore);

      return actions$.pipe(
        ofType(customerReceiptActions.loadCustomerReceiptsSuccess),
        tap(({ customerReceipts }) => {
          store.setItems(customerReceipts);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countCustomerReceiptsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(CustomerReceiptStore);

      return actions$.pipe(
        ofType(customerReceiptActions.countCustomerReceiptsSuccess),
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
      const store = inject(CustomerReceiptStore);

      return actions$.pipe(
        ofType(customerReceiptActions.updateCustomerReceiptSuccess),
        tap(({ customerReceipt }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === customerReceipt?.id ? customerReceipt : item
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
      const store = inject(CustomerReceiptStore);

      return actions$.pipe(
        ofType(customerReceiptActions.deleteCustomerReceiptSuccess),
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
      const store = inject(CustomerReceiptStore);

      return actions$.pipe(
        ofType(customerReceiptActions.createCustomerReceiptFailure),
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
      const store = inject(CustomerReceiptStore);

      return actions$.pipe(
        ofType(customerReceiptActions.loadCustomerReceiptByIdFailure),
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
      const store = inject(CustomerReceiptStore);

      return actions$.pipe(
        ofType(customerReceiptActions.loadCustomerReceiptsFailure),
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
      const store = inject(CustomerReceiptStore);

      return actions$.pipe(
        ofType(customerReceiptActions.updateCustomerReceiptFailure),
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
      const store = inject(CustomerReceiptStore);

      return actions$.pipe(
        ofType(customerReceiptActions.deleteCustomerReceiptFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};

