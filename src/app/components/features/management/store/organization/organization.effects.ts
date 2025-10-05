import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { organizationActions } from './organization.actions';
import { Organization } from './organization.model';
import { OrganizationStore } from './organization.store';
import { Count, LB4QueryBuilder } from '../../../../../util/lb4-query-builder';

export const organizationEffects = {
  // Bootstrap organization effect using new HTTP functions
  bootstrapOrganization: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(organizationActions.bootstrapOrganization),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/organization/bootstrap-with-data`;
          const requestId = `${organizationActions.bootstrapOrganization.type}-${Date.now()}-${Math.random()}`;
          const options = {
            actionName: 'bootstrapOrganization',
            successMessage: 'Organization bootstrapped successfully!',
            errorMessage: 'Failed to bootstrap organization',
            onSuccessAction: (organization: Organization) => organizationActions.bootstrapOrganizationSuccess({ organization }),
            onErrorAction: (error: any) => organizationActions.bootstrapOrganizationFailure({ error }),
            url: baseUrl,
            body: action.organization,
            headers: {
              'Content-Type': 'application/json'
            }
          }
          const config: HttpRequestConfig = {
            url: options.url,
            method: 'POST',
            body: options.body,
            headers: options.headers,
          };
          const metadata: HttpRequestMetadata<Organization> = {
            requestId,
            actionName: options.actionName,
            successMessage: options.successMessage,
            errorMessage: options.errorMessage,
            onSuccessAction: (organization) => organizationActions.bootstrapOrganizationSuccess({ organization }),
            onErrorAction: (error) => organizationActions.bootstrapOrganizationFailure({ error }),
            
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Keep these if you still need them for other effects that listen to success/failure actions
  // You can remove these if nothing else depends on them
  bootstrapSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(OrganizationStore);

      return actions$.pipe(
        ofType(organizationActions.bootstrapOrganizationSuccess),
        tap(({ organization }) => {
          store.setItems([organization]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  bootstrapFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(OrganizationStore);

      return actions$.pipe(
        ofType(organizationActions.bootstrapOrganizationFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Normal endpoint effects
  // Create Organization effect
  createOrganization: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(organizationActions.createOrganization),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/organization`;
          const requestId = `${organizationActions.createOrganization.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'POST',
            body: action.organization,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Organization> = {
            requestId,
            actionName: 'createOrganization',
            successMessage: 'Organization created successfully!',
            errorMessage: 'Failed to create bank cash',
            onSuccessAction: (organization) => organizationActions.createOrganizationSuccess({ organization }),
            onErrorAction: (error) => organizationActions.createOrganizationFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load Organization by Id effect
  loadOrganizationById: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(organizationActions.loadOrganizationById),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/organization/${action.id}`;
          const requestId = `${organizationActions.loadOrganizationById.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Organization> = {
            requestId,
            actionName: 'loadOrganizationById',
            errorMessage: 'Failed to load organization',
            onSuccessAction: (organization) => organizationActions.loadOrganizationByIdSuccess({ organization }),
            onErrorAction: (error) => organizationActions.loadOrganizationByIdFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Load all Organizations effect
  loadOrganizations: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(organizationActions.loadOrganizations),
        tap((action) => {
          const { limit, offset, search, sort } = action.query ?? {};
          const filter = LB4QueryBuilder.create()
          .applySignalStoreFilters(limit ?? 10, offset ?? 0, search ?? {query: '', fields: []}, sort ?? [])
          .build();
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/organization`;
          const requestId = `${organizationActions.loadOrganizations.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'GET',
            params: {filter: JSON.stringify(filter)},
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Organization[]> = {
            requestId,
            actionName: 'loadOrganizations',
            errorMessage: 'Failed to load organizations',
            onSuccessAction: (organizations) => organizationActions.loadOrganizationsSuccess({ organizations }),
            onErrorAction: (error) => organizationActions.loadOrganizationsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Count Organizations effect
  countOrganizations: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(organizationActions.countOrganizations),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/organization/count`;
          const requestId = `${organizationActions.countOrganizations.type}-${Date.now()}-${Math.random()}`;
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
            actionName: 'countOrganizations',
            errorMessage: 'Failed to count organizations',
            onSuccessAction: (count) => organizationActions.countOrganizationsSuccess({ count }),
            onErrorAction: (error) => organizationActions.countOrganizationsFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Update Organization effect
  updateOrganization: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(organizationActions.updateOrganization),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/organization/${action.id}`;
          const requestId = `${organizationActions.updateOrganization.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'PATCH',
            body: action.organization,
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<Organization> = {
            requestId,
            actionName: 'updateOrganization',
            successMessage: 'Organization updated successfully!',
            errorMessage: 'Failed to update organization',
            onSuccessAction: (organization) => organizationActions.updateOrganizationSuccess({ organization }),
            onErrorAction: (error) => organizationActions.updateOrganizationFailure({ error }),
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown> }));
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Delete Organization effect
  deleteOrganization: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const store = inject(Store);

      return actions$.pipe(
        ofType(organizationActions.deleteOrganization),
        tap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/organization/${action.id}`;
          const requestId = `${organizationActions.deleteOrganization.type}-${Date.now()}-${Math.random()}`;
          const config: HttpRequestConfig = {
            url: baseUrl,
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
          };
          const metadata: HttpRequestMetadata<void> = {
            requestId,
            actionName: 'deleteOrganization',
            successMessage: 'Organization deleted successfully!',
            errorMessage: 'Failed to delete organization',
            onSuccessAction: () => organizationActions.deleteOrganizationSuccess({ id: action.id }),
            onErrorAction: (error) => organizationActions.deleteOrganizationFailure({ error }),
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
      const store = inject(OrganizationStore);

      return actions$.pipe(
        ofType(organizationActions.createOrganizationSuccess),
        tap(({ organization }) => {
          store.setItems([organization, ...store.items()]);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadByIdSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(OrganizationStore);

      return actions$.pipe(
        ofType(organizationActions.loadOrganizationByIdSuccess),
        tap(({ organization }) => {
          store.setSelectedItem(organization);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  loadOrganizationsSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const store = inject(OrganizationStore);

      return actions$.pipe(
        ofType(organizationActions.loadOrganizationsSuccess),
        tap(({ organizations }) => {
          store.setItems(organizations);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  countOrganizationsSuccess: createEffect(

    () => {
      const actions$ = inject(Actions);
      const store = inject(OrganizationStore);

      return actions$.pipe(
        ofType(organizationActions.countOrganizationsSuccess),
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
      const store = inject(OrganizationStore);

      return actions$.pipe(
        ofType(organizationActions.updateOrganizationSuccess),
        tap(({ organization }) => {
          const currentItems = store.items();
          const updatedItems = currentItems.map(item => 
            item.id === organization?.id ? organization : item
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
      const store = inject(OrganizationStore);

      return actions$.pipe(
        ofType(organizationActions.deleteOrganizationSuccess),
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
      const store = inject(OrganizationStore);

      return actions$.pipe(
        ofType(organizationActions.createOrganizationFailure),
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
      const store = inject(OrganizationStore);

      return actions$.pipe(
        ofType(organizationActions.loadOrganizationByIdFailure),
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
      const store = inject(OrganizationStore);

      return actions$.pipe(
        ofType(organizationActions.loadOrganizationsFailure),
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
      const store = inject(OrganizationStore);

      return actions$.pipe(
        ofType(organizationActions.updateOrganizationFailure),
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
      const store = inject(OrganizationStore);

      return actions$.pipe(
        ofType(organizationActions.deleteOrganizationFailure),
        tap(({ error }) => {
          store.setError(error);
        })
      );
    },
    { functional: true, dispatch: false }
  )
};