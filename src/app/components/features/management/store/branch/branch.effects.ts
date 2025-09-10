import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';
import { branchActions } from './branch.actions';
import { Branch } from './branch.model';
import { BranchStore } from './branch.store';

export const branchEffects = {
  // Create Branch effect
  createBranch: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(branchActions.createBranch),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/branch`;
          const requestId = `${branchActions.createBranch.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.branch,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Branch> = {
            requestId,
            actionName: 'createBranch',
            successMessage: 'Branch created successfully!',
            errorMessage: 'Failed to create branch',
            onSuccessAction: (branch) => branchActions.createBranchSuccess({ branch }),
            onErrorAction: (error) => branchActions.createBranchFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load Branch by Id effect
  loadBranchById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(branchActions.loadBranchById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/branch/${action.id}`;
          const requestId = `${branchActions.loadBranchById.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Branch> = {
            requestId,
            actionName: 'loadBranchById',
            errorMessage: 'Failed to load branch',
            onSuccessAction: (branch) => branchActions.loadBranchByIdSuccess({ branch }),
            onErrorAction: (error) => branchActions.loadBranchByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all Branches effect
  loadBranchs: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(branchActions.loadBranches),
        tap((action) => {
          const { limit, offset, search, sort } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? {query: '', fields: []}, sort ?? [])
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/branch`;
          const requestId = `${branchActions.loadBranches.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Branch[]> = {
            requestId,
            actionName: 'loadBranches',
            errorMessage: 'Failed to load branchs',
            onSuccessAction: (branches) => branchActions.loadBranchesSuccess({ branches }),
            onErrorAction: (error) => branchActions.loadBranchesFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count Branches effect
  countBranchs: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(branchActions.countBranches),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/branch/count`;
          const requestId = `${branchActions.countBranches.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countBranches',
            errorMessage: 'Failed to count branchs',
            onSuccessAction: (count) => branchActions.countBranchesSuccess({ count }),
            onErrorAction: (error) => branchActions.countBranchesFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update Branch effect
  updateBranch: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(branchActions.updateBranch),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/branch/${action.id}`;
          const requestId = `${branchActions.updateBranch.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.branch,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Branch> = {
            requestId,
            actionName: 'updateBranch',
            successMessage: 'Branch updated successfully!',
            errorMessage: 'Failed to update branch',
            onSuccessAction: (branch) => branchActions.updateBranchSuccess({ branch }),
            onErrorAction: (error) => branchActions.updateBranchFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete Branch effect
  deleteBranch: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(branchActions.deleteBranch),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/branch/${action.id}`;
          const requestId = `${branchActions.deleteBranch.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteBranch',
            successMessage: 'Branch deleted successfully!',
            errorMessage: 'Failed to delete branch',
            onSuccessAction: () => branchActions.deleteBranchSuccess({ id: action.id }),
            onErrorAction: (error) => branchActions.deleteBranchFailure({ error }),
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
      const store = inject(BranchStore);

      return actions$.pipe(
        ofType(branchActions.createBranchSuccess),
        tap(({ branch }) => {
          store.setItems([branch, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(BranchStore);

      return actions$.pipe(
        ofType(branchActions.loadBranchByIdSuccess),
        tap(({ branch }) => {
          store.setSelectedItem(branch);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadBranchsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(BranchStore);

      return actions$.pipe(
        ofType(branchActions.loadBranchesSuccess),
        tap(({ branches }) => {
          store.setItems(branches);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countBranchsSuccess: createEffect(

    () => {
      const actions$ = inject(Actions);
      const store = inject(BranchStore);

      return actions$.pipe(
        ofType(branchActions.countBranchesSuccess),
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
      const store = inject(BranchStore);

      return actions$.pipe(
        ofType(branchActions.updateBranchSuccess),
        tap(({ branch }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === branch?.id ? branch : item
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
      const store = inject(BranchStore);

      return actions$.pipe(
        ofType(branchActions.deleteBranchSuccess),
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
      const store = inject(BranchStore);

      return actions$.pipe(
        ofType(branchActions.createBranchFailure),
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
      const store = inject(BranchStore);

      return actions$.pipe(
        ofType(branchActions.loadBranchByIdFailure),
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
      const store = inject(BranchStore);

      return actions$.pipe(
        ofType(branchActions.loadBranchesFailure),
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
      const store = inject(BranchStore);

      return actions$.pipe(
        ofType(branchActions.updateBranchFailure),
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
      const store = inject(BranchStore);

      return actions$.pipe(
        ofType(branchActions.deleteBranchFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};