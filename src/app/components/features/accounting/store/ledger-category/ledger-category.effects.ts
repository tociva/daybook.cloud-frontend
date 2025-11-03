import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { ledgerCategoryActions } from './ledger-category.actions';
import { LedgerCategory } from './ledger-category.model';
import { LedgerCategoryStore } from './ledger-category.store';

export const ledgerCategoryEffects = {
  // Create LedgerCategory effect
  createLedgerCategory: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(ledgerCategoryActions.createLedgerCategory),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/ledger-category`;
          const requestId = `${ledgerCategoryActions.createLedgerCategory.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.ledgerCategory,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<LedgerCategory> = {
            requestId,
            actionName: 'createLedgerCategory',
            successMessage: 'Ledger Category created successfully!',
            errorMessage: 'Failed to create ledger category',
            onSuccessAction: (ledgerCategory) => ledgerCategoryActions.createLedgerCategorySuccess({ ledgerCategory }),
            onErrorAction: (error) => ledgerCategoryActions.createLedgerCategoryFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load LedgerCategory by Id effect
  loadLedgerCategoryById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(ledgerCategoryActions.loadLedgerCategoryById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/ledger-category/${action.id}`;
          const requestId = `${ledgerCategoryActions.loadLedgerCategoryById.type}-${Date.now()}-${Math.random()}`;
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
          const metadata: HttpRequestMetadata<LedgerCategory> = {
            requestId,
            actionName: 'loadLedgerCategoryById',
            errorMessage: 'Failed to load ledger category',
            onSuccessAction: (ledgerCategory) => ledgerCategoryActions.loadLedgerCategoryByIdSuccess({ ledgerCategory }),
            onErrorAction: (error) => ledgerCategoryActions.loadLedgerCategoryByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all LedgerCategories effect
  loadLedgerCategories: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(ledgerCategoryActions.loadLedgerCategories),
        tap((action) => {
          const { limit, offset, search, sort, includes } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? [{query: '', fields: []}], sort ?? [], includes)
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/ledger-category`;
          const requestId = `${ledgerCategoryActions.loadLedgerCategories.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<LedgerCategory[]> = {
            requestId,
            actionName: 'loadLedgerCategories',
            errorMessage: 'Failed to load ledger categories',
            onSuccessAction: (ledgerCategories) => ledgerCategoryActions.loadLedgerCategoriesSuccess({ ledgerCategories }),
            onErrorAction: (error) => ledgerCategoryActions.loadLedgerCategoriesFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count LedgerCategories effect
  countLedgerCategories: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(ledgerCategoryActions.countLedgerCategories),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/ledger-category/count`;
          const requestId = `${ledgerCategoryActions.countLedgerCategories.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countLedgerCategories',
            errorMessage: 'Failed to count ledger categories',
            onSuccessAction: (count) => ledgerCategoryActions.countLedgerCategoriesSuccess({ count }),
            onErrorAction: (error) => ledgerCategoryActions.countLedgerCategoriesFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update LedgerCategory effect
  updateLedgerCategory: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(ledgerCategoryActions.updateLedgerCategory),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/ledger-category/${action.id}`;
          const requestId = `${ledgerCategoryActions.updateLedgerCategory.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.ledgerCategory,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<LedgerCategory> = {
            requestId,
            actionName: 'updateLedgerCategory',
            successMessage: 'Ledger Category updated successfully!',
            errorMessage: 'Failed to update ledger category',
            onSuccessAction: (ledgerCategory) => ledgerCategoryActions.updateLedgerCategorySuccess({ ledgerCategory }),
            onErrorAction: (error) => ledgerCategoryActions.updateLedgerCategoryFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete LedgerCategory effect
  deleteLedgerCategory: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(ledgerCategoryActions.deleteLedgerCategory),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/accounting/ledger-category/${action.id}`;
          const requestId = `${ledgerCategoryActions.deleteLedgerCategory.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteLedgerCategory',
            successMessage: 'Ledger Category deleted successfully!',
            errorMessage: 'Failed to delete ledger category',
            onSuccessAction: () => ledgerCategoryActions.deleteLedgerCategorySuccess({ id: action.id }),
            onErrorAction: (error) => ledgerCategoryActions.deleteLedgerCategoryFailure({ error }),
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
      const store = inject(LedgerCategoryStore);

      return actions$.pipe(
        ofType(ledgerCategoryActions.createLedgerCategorySuccess),
        tap(({ ledgerCategory }) => {
          store.setItems([ledgerCategory, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(LedgerCategoryStore);

      return actions$.pipe(
        ofType(ledgerCategoryActions.loadLedgerCategoryByIdSuccess),
        tap(({ ledgerCategory }) => {
          store.setSelectedItem(ledgerCategory);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadLedgerCategoriesSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(LedgerCategoryStore);

      return actions$.pipe(
        ofType(ledgerCategoryActions.loadLedgerCategoriesSuccess),
        tap(({ ledgerCategories }) => {
          store.setItems(ledgerCategories);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countLedgerCategoriesSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(LedgerCategoryStore);

      return actions$.pipe(
        ofType(ledgerCategoryActions.countLedgerCategoriesSuccess),
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
      const store = inject(LedgerCategoryStore);

      return actions$.pipe(
        ofType(ledgerCategoryActions.updateLedgerCategorySuccess),
        tap(({ ledgerCategory }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === ledgerCategory?.id ? ledgerCategory : item
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
      const store = inject(LedgerCategoryStore);

      return actions$.pipe(
        ofType(ledgerCategoryActions.deleteLedgerCategorySuccess),
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
      const store = inject(LedgerCategoryStore);

      return actions$.pipe(
        ofType(ledgerCategoryActions.createLedgerCategoryFailure),
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
      const store = inject(LedgerCategoryStore);

      return actions$.pipe(
        ofType(ledgerCategoryActions.loadLedgerCategoryByIdFailure),
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
      const store = inject(LedgerCategoryStore);

      return actions$.pipe(
        ofType(ledgerCategoryActions.loadLedgerCategoriesFailure),
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
      const store = inject(LedgerCategoryStore);

      return actions$.pipe(
        ofType(ledgerCategoryActions.updateLedgerCategoryFailure),
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
      const store = inject(LedgerCategoryStore);

      return actions$.pipe(
        ofType(ledgerCategoryActions.deleteLedgerCategoryFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};
