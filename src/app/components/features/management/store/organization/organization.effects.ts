import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { organizationActions } from './organization.actions';
import { tap, catchError, mergeMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { Organization } from './organization.model';
import { OrganizationStore } from './organization.store';
import { ConfigStore } from '../../../../core/auth/store/config/config.store';
import { ToastStore } from '../../../../shared/store/toast/toast.store';
import { UiStore } from '../../../../../state/ui/ui.store';

export const organizationEffects = {
  // Bootstrap organization effect using createEffect
  bootstrapOrganization: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const configStore = inject(ConfigStore);
      const toast = inject(ToastStore);
      const ui = inject(UiStore);

      return actions$.pipe(
        ofType(organizationActions.bootstrapOrganization),
        mergeMap((action) => {
          const token = `bootstrapOrganization-${Date.now()}-${Math.random()}`;
          ui.startLoading(token);

          const baseUrl = `${configStore.config().apiBaseUrl}/organization/organization`;
          return http.post<Organization>(`${baseUrl}/bootstrap`, action.organization).pipe(
            map((organization) => {
              toast.show('Organization bootstrapped successfully!', 'success');
              return organizationActions.bootstrapOrganizationSuccess({ organization });
            }),
            catchError((error) => {
              toast.show('Failed to bootstrap organization', 'error');
              return of(organizationActions.bootstrapOrganizationFailure({ error }));
            }),
            tap(() => ui.stopLoading(token))
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
  )
};
