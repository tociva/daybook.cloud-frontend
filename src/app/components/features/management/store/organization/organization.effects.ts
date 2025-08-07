import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { organizationActions } from './organization.actions';
import { tap, catchError, mergeMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { Organization } from './organization.model';
import { OrganizationStore } from './organization.store';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { toastActions } from '../../../../shared/store/toast/toast.actions';

export const organizationEffects = {
  // Bootstrap organization effect using createEffect
  bootstrapOrganization: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const configStore = inject(ConfigStore);

      return actions$.pipe(
        ofType(organizationActions.bootstrapOrganization),
        mergeMap((action) => {
          const baseUrl = `${configStore.config().apiBaseUrl}/organization/organization`;
          return http.post<Organization>(`${baseUrl}/bootstrap`, action.organization).pipe(
            map((organization) => organizationActions.bootstrapOrganizationSuccess({ organization })),
            catchError((error) => of(organizationActions.bootstrapOrganizationFailure({ error })))
          );
        })
      );
    },
    { functional: true }
  ),

  // Handle success
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

  // Handle failure
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

  // Show success toast
  bootstrapSuccessToast: createEffect(
    () => {
      const actions$ = inject(Actions);

      return actions$.pipe(
        ofType(organizationActions.bootstrapOrganizationSuccess),
        map(() => toastActions.show({ 
          message: 'Organization bootstrapped successfully!', 
          toastType: 'success',
          duration: 3000
        }))
      );
    },
    { functional: true }
  ),

  // Show error toast
  bootstrapFailureToast: createEffect(
    () => {
      const actions$ = inject(Actions);

      return actions$.pipe(
        ofType(organizationActions.bootstrapOrganizationFailure),
        map(({ error }) => toastActions.show({ 
          message: `Failed to bootstrap organization: ${error}`, 
          toastType: 'error',
          duration: 5000
        }))
      );
    },
    { functional: true }
  )
};
