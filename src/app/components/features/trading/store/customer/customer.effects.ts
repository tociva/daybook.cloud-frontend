import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { customerActions } from './customer.actions';
import { Customer } from './customer.model';
import { CustomerStore } from './customer.store';

export const customerEffects = {
  // Create Customer effect
  createCustomer: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(customerActions.createCustomer),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/customer`;
          const requestId = `${customerActions.createCustomer.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.customer,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Customer> = {
            requestId,
            actionName: 'createCustomer',
            successMessage: 'Customer created successfully!',
            errorMessage: 'Failed to create customer',
            onSuccessAction: (customer) => customerActions.createCustomerSuccess({ customer }),
            onErrorAction: (error) => customerActions.createCustomerFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load Customer by Id effect
  loadCustomerById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(customerActions.loadCustomerById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/customer/${action.id}`;
          const requestId = `${customerActions.loadCustomerById.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            params: action.query as Record<string, unknown>
          };
          const metadata: HttpRequestMetadata<Customer> = {
            requestId,
            actionName: 'loadCustomerById',
            errorMessage: 'Failed to load customer',
            onSuccessAction: (customer) => customerActions.loadCustomerByIdSuccess({ customer }),
            onErrorAction: (error) => customerActions.loadCustomerByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all Customers effect
  loadCustomers: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(customerActions.loadCustomers),
        tap((action) => {
          const { limit, offset, search, sort, includes } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? [{query: '', fields: []}], sort ?? [])
          .applySignalStoreIncludes(includes ?? [])
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/customer`;
          const requestId = `${customerActions.loadCustomers.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Customer[]> = {
            requestId,
            actionName: 'loadCustomers',
            errorMessage: 'Failed to load customers',
            onSuccessAction: (customers) => customerActions.loadCustomersSuccess({ customers }),
            onErrorAction: (error) => customerActions.loadCustomersFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count Customers effect
  countCustomers: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(customerActions.countCustomers),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/customer/count`;
          const requestId = `${customerActions.countCustomers.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countCustomers',
            errorMessage: 'Failed to count customers',
            onSuccessAction: (count) => customerActions.countCustomersSuccess({ count }),
            onErrorAction: (error) => customerActions.countCustomersFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update Customer effect
  updateCustomer: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(customerActions.updateCustomer),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/customer/${action.id}`;
          const requestId = `${customerActions.updateCustomer.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.customer,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Customer> = {
            requestId,
            actionName: 'updateCustomer',
            successMessage: 'Customer updated successfully!',
            errorMessage: 'Failed to update customer',
            onSuccessAction: (customer) => customerActions.updateCustomerSuccess({ customer }),
            onErrorAction: (error) => customerActions.updateCustomerFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete Customer effect
  deleteCustomer: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(customerActions.deleteCustomer),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/customer/${action.id}`;
          const requestId = `${customerActions.deleteCustomer.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteCustomer',
            successMessage: 'Customer deleted successfully!',
            errorMessage: 'Failed to delete customer',
            onSuccessAction: () => customerActions.deleteCustomerSuccess({ id: action.id }),
            onErrorAction: (error) => customerActions.deleteCustomerFailure({ error }),
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
      const store = inject(CustomerStore);

      return actions$.pipe(
        ofType(customerActions.createCustomerSuccess),
        tap(({ customer }) => {
          store.setItems([customer, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(CustomerStore);

      return actions$.pipe(
        ofType(customerActions.loadCustomerByIdSuccess),
        tap(({ customer }) => {
          store.setSelectedItem(customer);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadCustomersSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(CustomerStore);

      return actions$.pipe(
        ofType(customerActions.loadCustomersSuccess),
        tap(({ customers }) => {
          store.setItems(customers);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countCustomersSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(CustomerStore);

      return actions$.pipe(
        ofType(customerActions.countCustomersSuccess),
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
      const store = inject(CustomerStore);

      return actions$.pipe(
        ofType(customerActions.updateCustomerSuccess),
        tap(({ customer }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === customer?.id ? customer : item
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
      const store = inject(CustomerStore);

      return actions$.pipe(
        ofType(customerActions.deleteCustomerSuccess),
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
      const store = inject(CustomerStore);

      return actions$.pipe(
        ofType(customerActions.createCustomerFailure),
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
      const store = inject(CustomerStore);

      return actions$.pipe(
        ofType(customerActions.loadCustomerByIdFailure),
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
      const store = inject(CustomerStore);

      return actions$.pipe(
        ofType(customerActions.loadCustomersFailure),
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
      const store = inject(CustomerStore);

      return actions$.pipe(
        ofType(customerActions.updateCustomerFailure),
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
      const store = inject(CustomerStore);

      return actions$.pipe(
        ofType(customerActions.deleteCustomerFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};
