import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
import { organizationActions } from './organization.actions';
import { Organization } from './organization.model';
import { OrganizationStore } from './organization.store';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { httpActions } from '../../../../../state/http/http.actions';
import { HttpRequestConfig, HttpRequestMetadata } from '../../../../../state/http/http.model';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';

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
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/organization/bootstrap`;
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
          const metadata: HttpRequestMetadata<Organization, Error> = {
            requestId,
            actionName: options.actionName,
            successMessage: options.successMessage,
            errorMessage: options.errorMessage,
            onSuccessAction: (organization) => organizationActions.bootstrapOrganizationSuccess({ organization }),
            onErrorAction: (error) => organizationActions.bootstrapOrganizationFailure({ error }),
            
          };
          store.dispatch(httpActions.executeRequest({ config, metadata: metadata as HttpRequestMetadata<unknown, unknown> }));
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
      const router = inject(Router);

      return actions$.pipe(
        ofType(organizationActions.bootstrapOrganizationSuccess),
        tap(({ organization }) => {
          store.setItems([organization]);
          router.navigate(['/']);
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
  )
};