import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { taxGroupActions } from './tax-group.actions';
import { TaxGroup } from './tax-group.model';
import { TaxGroupStore } from './tax-group.store';

export const taxGroupEffects = {
  // Create TaxGroup effect
  createTaxGroup: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(taxGroupActions.createTaxGroup),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/tax-group`;
          const requestId = `${taxGroupActions.createTaxGroup.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.taxGroup,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<TaxGroup> = {
            requestId,
            actionName: 'createTaxGroup',
            successMessage: 'Tax group created successfully!',
            errorMessage: 'Failed to create tax group',
            onSuccessAction: (taxGroup) => taxGroupActions.createTaxGroupSuccess({ taxGroup }),
            onErrorAction: (error) => taxGroupActions.createTaxGroupFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load TaxGroup by Id effect
  loadTaxGroupById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(taxGroupActions.loadTaxGroupById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/tax-group/${action.id}`;
          const requestId = `${taxGroupActions.loadTaxGroupById.type}-${Date.now()}-${Math.random()}`;
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
          const metadata: HttpRequestMetadata<TaxGroup> = {
            requestId,
            actionName: 'loadTaxGroupById',
            errorMessage: 'Failed to load tax group',
            onSuccessAction: (taxGroup) => taxGroupActions.loadTaxGroupByIdSuccess({ taxGroup }),
            onErrorAction: (error) => taxGroupActions.loadTaxGroupByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all TaxGroups effect
  loadTaxGroups: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(taxGroupActions.loadTaxGroups),
        tap((action) => {
          const { limit, offset, search, sort, includes } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? {query: '', fields: []}, sort ?? [], includes)
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/tax-group`;
          const requestId = `${taxGroupActions.loadTaxGroups.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<TaxGroup[]> = {
            requestId,
            actionName: 'loadTaxGroups',
            errorMessage: 'Failed to load tax groups',
            onSuccessAction: (taxGroups) => taxGroupActions.loadTaxGroupsSuccess({ taxGroups }),
            onErrorAction: (error) => taxGroupActions.loadTaxGroupsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count TaxGroups effect
  countTaxGroups: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(taxGroupActions.countTaxGroups),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/tax-group/count`;
          const requestId = `${taxGroupActions.countTaxGroups.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countTaxGroups',
            errorMessage: 'Failed to count tax groups',
            onSuccessAction: (count) => taxGroupActions.countTaxGroupsSuccess({ count }),
            onErrorAction: (error) => taxGroupActions.countTaxGroupsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update TaxGroup effect
  updateTaxGroup: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(taxGroupActions.updateTaxGroup),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/tax-group/${action.id}`;
          const requestId = `${taxGroupActions.updateTaxGroup.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.taxGroup,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<TaxGroup> = {
            requestId,
            actionName: 'updateTaxGroup',
            successMessage: 'Tax group updated successfully!',
            errorMessage: 'Failed to update tax group',
            onSuccessAction: (taxGroup) => taxGroupActions.updateTaxGroupSuccess({ taxGroup }),
            onErrorAction: (error) => taxGroupActions.updateTaxGroupFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete TaxGroup effect
  deleteTaxGroup: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(taxGroupActions.deleteTaxGroup),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/inventory/tax-group/${action.id}`;
          const requestId = `${taxGroupActions.deleteTaxGroup.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteTaxGroup',
            successMessage: 'Tax group deleted successfully!',
            errorMessage: 'Failed to delete tax group',
            onSuccessAction: () => taxGroupActions.deleteTaxGroupSuccess({ id: action.id }),
            onErrorAction: (error) => taxGroupActions.deleteTaxGroupFailure({ error }),
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
      const store = inject(TaxGroupStore);

      return actions$.pipe(
        ofType(taxGroupActions.createTaxGroupSuccess),
        tap(({ taxGroup }) => {
          store.setItems([taxGroup, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(TaxGroupStore);

      return actions$.pipe(
        ofType(taxGroupActions.loadTaxGroupByIdSuccess),
        tap(({ taxGroup }) => {
          store.setSelectedItem(taxGroup);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadTaxGroupsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(TaxGroupStore);

      return actions$.pipe(
        ofType(taxGroupActions.loadTaxGroupsSuccess),
        tap(({ taxGroups }) => {
          store.setItems(taxGroups);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countTaxGroupsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(TaxGroupStore);

      return actions$.pipe(
        ofType(taxGroupActions.countTaxGroupsSuccess),
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
      const store = inject(TaxGroupStore);

      return actions$.pipe(
        ofType(taxGroupActions.updateTaxGroupSuccess),
        tap(({ taxGroup }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === taxGroup?.id ? taxGroup : item
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
      const store = inject(TaxGroupStore);

      return actions$.pipe(
        ofType(taxGroupActions.deleteTaxGroupSuccess),
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
      const store = inject(TaxGroupStore);

      return actions$.pipe(
        ofType(taxGroupActions.createTaxGroupFailure),
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
      const store = inject(TaxGroupStore);

      return actions$.pipe(
        ofType(taxGroupActions.loadTaxGroupByIdFailure),
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
      const store = inject(TaxGroupStore);

      return actions$.pipe(
        ofType(taxGroupActions.loadTaxGroupsFailure),
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
      const store = inject(TaxGroupStore);

      return actions$.pipe(
        ofType(taxGroupActions.updateTaxGroupFailure),
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
      const store = inject(TaxGroupStore);

      return actions$.pipe(
        ofType(taxGroupActions.deleteTaxGroupFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};
